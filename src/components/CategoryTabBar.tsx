/**
 * 分类导航 tab 栏(桌面+移动端统一,WeTab 风格)
 * - 横向滚动 chip,当前分类高亮
 * - 点击平滑跳转
 */

"use client";

import { cn } from "@/lib/utils";
import { useActiveCategory } from "@/hooks/use-active-category";
import type { Category } from "@/lib/storage/local-storage";

interface CategoryTabBarProps {
  categories: Category[];
}

export function CategoryTabBar({ categories }: CategoryTabBarProps) {
  const activeId = useActiveCategory(categories);

  if (categories.length === 0) return null;

  const handleClick = (categoryId: string) => {
    const el = document.getElementById(`category-${categoryId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav aria-label="分类导航">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((cat) => {
          const isActive = activeId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleClick(cat.id)}
              className={cn(
                "flex flex-shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-[var(--primary-500)] bg-[var(--primary-600)] text-white"
                  : "border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
              )}
            >
              <span>{cat.name}</span>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  isActive ? "text-white/75" : "text-[var(--muted-foreground)]"
                )}
              >
                {cat.sites.length}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
