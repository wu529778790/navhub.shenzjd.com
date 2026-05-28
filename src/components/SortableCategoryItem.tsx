"use client";

import { Suspense, lazy } from "react";
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
  onSiteChange: () => void;
  viewMode: "grid" | "list";
}

export function SortableCategoryItem({
  category,
  onEdit,
  onDelete,
  isGuestMode,
  allCategories,
  onSiteChange,
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

  const handleCategoryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(`category-${category.id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, "", `#category-${category.id}`);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="category-card group p-5"
      id={`category-${category.id}`}
    >
      <div
        className="flex items-center justify-between mb-4 cursor-move p-2 -mx-2 -mt-2 rounded-lg"
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="p-1.5 bg-[var(--primary-100)] rounded-[var(--radius-sm)] text-[var(--primary-700)]">
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h3
              className="font-semibold text-lg text-[var(--foreground)] flex items-center gap-2 cursor-pointer"
              onClick={handleCategoryClick}
              title="点击跳转到此分类"
            >
              <IconFolder className="w-5 h-5 text-[var(--primary-600)]" />
              <span>{category.name}</span>
            </h3>
          </div>
        </div>

        {!isGuestMode && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(category);
              }}
              className="px-2 hover:bg-[var(--muted)]"
              title="编辑分类"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(category.id);
              }}
              className="px-2 text-[var(--error)] hover:bg-[var(--error)]/10"
              title="删除分类"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 mt-2">
            <div className="w-[100px] h-[100px] bg-[var(--muted)] rounded-[var(--radius-md)] animate-pulse" />
          </div>
        }
      >
        <SortableSites
          category={category}
          allCategories={allCategories}
          onSiteChange={onSiteChange}
          view={viewMode}
        />
      </Suspense>
    </div>
  );
}
