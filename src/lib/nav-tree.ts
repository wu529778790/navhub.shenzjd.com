/**
 * 树形导航数据公共工具（纯函数，服务端/客户端通用）
 *
 * 首页 page.tsx、分类页 app/c/[id]/page.tsx、HomeClient 共用，
 * 避免三处各写一份 findNode / 墓碑过滤等逻辑。
 */

import type { Category, Site } from "@/types";

/** 在树中查找节点（任意深度） */
export function findNode(categories: Category[], id: string | null | undefined): Category | null {
  if (!id) return null;
  for (const c of categories) {
    if (c.id === id) return c;
    if (c.children) {
      const found = findNode(c.children, id);
      if (found) return found;
    }
  }
  return null;
}

/** 返回节点到根的路径（根 → 节点；不存在返回空数组） */
export function findPath(categories: Category[], id: string | null | undefined): Category[] {
  if (!id) return [];
  for (const c of categories) {
    if (c.id === id) return [c];
    if (c.children) {
      const sub = findPath(c.children, id);
      if (sub.length > 0) return [c, ...sub];
    }
  }
  return [];
}

/** 统计节点下挂站点总数（含子孙） */
export function countDescendantSites(node: Category): number {
  let n = node.sites.length;
  for (const c of node.children ?? []) n += countDescendantSites(c);
  return n;
}

/**
 * 渲染前过滤墓碑条目（数据里可能有 _deleted 标记）。
 * 必须整棵递归：readNavData 组树时不过滤（墓碑行留在库里供同步侧迁移赞踩），
 * 只滤顶层会让子层级的软删分类原样渲染——源站改编号产生的旧分类墓碑会以
 * 幽灵分类混进树里（2026-10-25：「07.AI 知识库」「09.AI 图片」等软删行与
 * 存活的 11.AI 知识库 / 06.AI 图片 同屏，编号成对重复、计数虚高）。
 */
export function visibleCategories(categories: Category[]): Category[] {
  return categories
    .filter((c) => !c._deleted)
    .map((c) => ({
      ...c,
      sites: c.sites.filter((s: Site) => !s._deleted),
      children: c.children ? visibleCategories(c.children) : c.children,
    }));
}
