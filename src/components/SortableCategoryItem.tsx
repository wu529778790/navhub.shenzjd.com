"use client";

import { Suspense, lazy, memo } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, GripVertical } from "lucide-react";
import { IconFolder } from "@/components/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Category } from "@/lib/storage/local-storage";

const SortableSites = lazy(() =>
  import("@/components/SortableSites").then((module) => ({ default: module.SortableSites }))
);

interface SortableCategoryItemProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  isGuestMode: boolean;
  allCategories: Category[];
  viewMode: "grid" | "list";
}

export const SortableCategoryItem = memo(function SortableCategoryItem({
  category,
  onEdit,
  onDelete,
  isGuestMode,
  allCategories,
  viewMode,
}: SortableCategoryItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="category-card group"
      id={`category-${category.id}`}
    >
      {/* 分类标题行 */}
      <div
        className="flex items-center gap-3 mb-3 cursor-move px-1 py-2 -mx-1 rounded-[var(--radius-md)] hover:bg-[var(--muted)]/50 transition-colors"
        {...attributes}
        {...listeners}
      >
        <div className="text-[var(--muted-foreground)] p-0.5 rounded hover:text-[var(--foreground-secondary)] transition-colors">
          <GripVertical className="w-4 h-4" />
        </div>
        <h3 className="font-semibold text-[15px] tracking-tight text-[var(--foreground)] flex items-center gap-2 flex-1 min-w-0">
          <IconFolder className="w-4 h-4 text-[var(--primary-600)] flex-shrink-0" />
          <span className="truncate">{category.name}</span>
          <span className="text-xs font-normal text-[var(--muted-foreground)] tabular-nums flex-shrink-0">
            {category.sites.length}
          </span>
        </h3>

        {!isGuestMode && (
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(category);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] transition-colors hover:bg-[var(--muted)] cursor-pointer"
              title="编辑分类"
            >
              <Edit2 className="w-3.5 h-3.5 text-[var(--foreground-secondary)]" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(category.id);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] transition-colors hover:bg-[var(--error)]/10 cursor-pointer"
              title="删除分类"
            >
              <Trash2 className="w-3.5 h-3.5 text-[var(--foreground-secondary)] hover:text-[var(--error)]" />
            </button>
          </div>
        )}
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
            {[...Array(4)].map((_, j) => (
              <div
                key={j}
                className="w-[100px] h-[100px] bg-[var(--muted)] rounded-[var(--radius-md)] animate-pulse"
              />
            ))}
          </div>
        }
      >
        <SortableSites category={category} allCategories={allCategories} view={viewMode} />
      </Suspense>
    </div>
  );
});
