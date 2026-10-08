/**
 * sitemap.xml — 首页 + 分类页（2026-10-08 修正）
 *
 * 数据源：Turso 全量（readNavData 走进程内缓存，零额外 DB 压力），
 * 读取失败时降级 seed 数据（src/data/sites.json），保证 sitemap 始终可用。
 * 条目：
 * - 站点本体（首页）
 * - 全部分类页 /c/[id]（递归全树）——让爬虫发现每个独立分类页
 *
 * 注意：sitemap 协议要求所有 URL 与 sitemap 同域，收录的第三方站点外链
 * 不能放进 sitemap（Google 报"不允许的网址"）；外链由页面正常 <a> 链接
 * 供爬虫发现，无需收录站收录。
 */

import type { MetadataRoute } from "next";
import { readNavData } from "@/lib/server/turso";
import { safeDate } from "@/lib/safe-date";
import { visibleCategories } from "@/lib/nav-tree";
import seed from "@/data/sites.json";
import type { Category } from "@/types";

// 读数据库需要动态执行（build 期不连 Turso）；数据本身走缓存，成本可忽略
export const dynamic = "force-dynamic";

const SITE_URL = "https://navhub.shenzjd.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  let categories: Category[] = [];
  try {
    const data = await readNavData();
    if (data) {
      categories = visibleCategories(data.categories);
    }
  } catch (error) {
    console.error("sitemap 读取数据库失败，降级 seed:", error);
  }
  if (categories.length === 0) {
    categories = (seed.categories ?? []) as Category[];
  }

  // 递归收集全部分类页（含子分类）
  const walkCategories = (cats: Category[]) => {
    for (const c of cats) {
      entries.push({
        url: `${SITE_URL}/c/${c.id}`,
        lastModified: safeDate(c.updatedAt),
        changeFrequency: "daily",
        priority: 0.7,
      });
      if (c.children) walkCategories(c.children);
    }
  };
  walkCategories(categories);

  return entries;
}
