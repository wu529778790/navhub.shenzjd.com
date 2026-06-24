/**
 * 站点列表展示组件 - 纯展示，拖拽由外层统一 DndContext 管理
 */

"use client";

import { memo } from "react";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAuth } from "@/contexts/SitesContext";
import { SiteCard } from "@/components/SiteCard";
import { AddSiteCard } from "@/components/AddSiteCard";
import type { Category } from "@/lib/storage/local-storage";

interface SortableSitesProps {
  category: {
    id: string;
    name: string;
    icon?: string;
    sort?: number;
    sites: Array<{
      id: string;
      title: string;
      url: string;
      favicon?: string;
      sort?: number;
    }>;
  };
  view?: "grid" | "list";
}

/** 可排序的站点项包装器 — 拖拽手柄覆盖整个卡片区域 */
function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative"
    >
      {/* 内部子元素禁用指针事件，防止图片/按钮抢走拖拽事件 */}
      <div className="pointer-events-none">
        {children}
      </div>
      {/* 恢复交互层 — 让点击/菜单等操作正常工作 */}
      <div className="absolute inset-0 pointer-events-auto" />
    </div>
  );
}

export const SortableSites = memo(function SortableSites({
  category,
  view = "grid",
}: SortableSitesProps) {
  const { isGuestMode } = useAuth();

  // 网格视图布局 — 用 CSS Grid 固定列宽，避免拖拽时的挤压/跳动
  if (view === "grid") {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 mt-2 w-full contain-layout">
        {category.sites.map((site) => (
          <SortableItem key={site.id} id={site.id}>
            <SiteCard
              id={site.id}
              title={site.title}
              url={site.url}
              favicon={site.favicon}
              categoryId={category.id}
              view="grid"
            />
          </SortableItem>
        ))}

        {/* 添加站点卡片（登录态始终可见） */}
        {!isGuestMode && (
          <div className="w-[100px] h-[100px] flex-shrink-0">
            <AddSiteCard activeCategory={category.id} view="grid" />
          </div>
        )}
      </div>
    );
  }

  // 列表视图布局
  return (
    <div className="flex flex-col gap-2 mt-2">
      {category.sites.map((site) => (
        <SortableItem key={site.id} id={site.id}>
          <SiteCard
            id={site.id}
            title={site.title}
            url={site.url}
            favicon={site.favicon}
            categoryId={category.id}
            view="list"
          />
        </SortableItem>
      ))}

      {/* 添加站点卡片（登录态始终可见） */}
      {!isGuestMode && (
        <AddSiteCard activeCategory={category.id} view="list" />
      )}
    </div>
  );
});
