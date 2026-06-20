/**
 * 浮动分类侧边栏(桌面端 lg+)
 * - 独立圆角卡片 + 阴影,sticky 跟随滚动
 * - 顶部:分类搜索框(过滤分类名)
 * - 列表:"全部" 快捷项 + 各分类(当前项左侧青绿指示条高亮)
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { IconFolder } from "@/components/icons";
import { LayoutGrid, Search } from "lucide-react";
import { useActiveCategory } from "@/hooks/use-active-category";
import type { Category } from "@/lib/storage/local-storage";

interface CategorySidebarProps {
  categories: Category[];
}

export function CategorySidebar({ categories }: CategorySidebarProps) {
  const activeId = useActiveCategory(categories);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, query]);

  const totalSites = useMemo(
    () => categories.reduce((sum, c) => sum + c.sites.length, 0),
    [categories]
  );

  const handleClick = useCallback((categoryId: string) => {
    const el = document.getElementById(`category-${categoryId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleAll = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (categories.length === 0) return null;

  const itemBase =
    "relative flex w-full cursor-pointer items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm transition-colors";
  const itemActive =
    "bg-[var(--primary-50)] font-semibold text-[var(--primary-700)] before:absolute before:left-0.5 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-[var(--primary-500)] before:content-['']";
  const itemIdle =
    "text-[var(--foreground-secondary)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]";

  return (
    <aside className="hidden w-56 flex-shrink-0 lg:block">
      <nav
        aria-label="分类导航"
        className="sticky top-20 flex max-h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--background-secondary)] shadow-[var(--shadow-sm)]"
      >
        <div className="border-b border-[var(--border)] p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索分类"
              aria-label="搜索分类"
              className="w-full rounded-[var(--radius-md)] border border-[var(--input-border)] bg-[var(--background)] py-1.5 pl-8 pr-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]/15"
            />
          </div>
        </div>

        <div className="overflow-y-auto p-2">
          <div className="space-y-0.5">
            <button onClick={handleAll} className={cn(itemBase, !activeId ? itemActive : itemIdle)}>
              <LayoutGrid className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">全部</span>
              <span className="ml-auto text-xs tabular-nums text-[var(--muted-foreground)]">
                {totalSites}
              </span>
            </button>

            {filtered.map((cat) => {
              const isActive = activeId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleClick(cat.id)}
                  className={cn(itemBase, isActive ? itemActive : itemIdle)}
                >
                  <IconFolder
                    className={cn(
                      "h-4 w-4 flex-shrink-0",
                      isActive ? "text-[var(--primary-600)]" : "text-[var(--muted-foreground)]"
                    )}
                  />
                  <span className="truncate">{cat.name}</span>
                  <span className="ml-auto text-xs tabular-nums text-[var(--muted-foreground)]">
                    {cat.sites.length}
                  </span>
                </button>
              );
            })}

            {filtered.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-[var(--muted-foreground)]">
                无匹配分类
              </div>
            )}
          </div>
        </div>
      </nav>
    </aside>
  );
}
