/**
 * 分类管理组件
 * 负责分类的新增、编辑、删除操作
 */

"use client";

import { useState, useEffect, lazy, Suspense, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/storage/local-storage";

// 标准 React.lazy + Suspense 模式，模块级加载（仅加载一次）
const AddCategoryDialog = lazy(() =>
  import("@/components/AddCategoryDialog").then((m) => ({ default: m.AddCategoryDialog }))
);

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (category: Category) => void;
  onUpdateSites: (sites: Category[]) => void;
  isGuestMode: boolean;
}

export function CategoryManager({
  categories,
  onAddCategory,
  onUpdateSites,
  isGuestMode,
}: CategoryManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [, startTransition] = useTransition();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);

  const handleEditCategory = () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    const newCategories = categories.map((c) =>
      c.id === editingCategory.id
        ? { ...c, name: editingCategory.name.trim() }
        : c
    );
    onUpdateSites(newCategories);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const newCategories = categories.filter((c) => c.id !== categoryId);
    onUpdateSites(newCategories);
    setDeletingCategory(null);
  };

  return (
    <>
      {/* 新建按钮 */}
      {!isGuestMode && (
        <Button
          size="sm"
          onClick={() => startTransition(() => setShowAddDialog(true))}
          className="h-8 flex-shrink-0 gap-1"
          title="新建分类 (Ctrl/Cmd+Alt+N)"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">新建</span>
        </Button>
      )}

      {/* 新增分类弹窗 */}
      {showAddDialog && (
        <AddCategoryDialogWrapper
          onClose={() => setShowAddDialog(false)}
          onConfirm={(name) => {
            onAddCategory({
              id: `cat_${crypto.randomUUID()}`,
              name: name.trim(),
              sort: categories.length,
              sites: [],
            });
            setShowAddDialog(false);
          }}
        />
      )}

      {/* 编辑分类弹窗 */}
      {editingCategory && (
        <Dialog open onOpenChange={() => setEditingCategory(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">编辑分类</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground-secondary)]">
                  分类名称
                </label>
                <Input
                  value={editingCategory.name}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, name: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEditCategory();
                    if (e.key === "Escape") setEditingCategory(null);
                  }}
                  placeholder="输入分类名称"
                  autoFocus
                  className="h-12 rounded-[var(--radius-lg)]"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-[var(--border)]">
              <Button
                variant="outline"
                onClick={() => setEditingCategory(null)}
                className={cn(
                  "flex-1 h-11 rounded-[var(--radius-lg)]",
                  "border-[var(--border)] hover:border-[var(--border-strong)]",
                  "hover:bg-[var(--muted)]",
                  "transition-all duration-200 active:scale-95"
                )}
              >
                取消
              </Button>
              <Button
                onClick={handleEditCategory}
                className="flex-1 h-11 rounded-[var(--radius-lg)] font-medium transition-all duration-200 active:scale-95"
              >
                保存
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 删除确认弹窗 */}
      {deletingCategory && (
        <Dialog open onOpenChange={() => setDeletingCategory(null)}>
          <DialogContent>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-[var(--error)]/10 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-[var(--error)]" />
                </div>
                <DialogTitle className="text-2xl font-bold">确认删除分类</DialogTitle>
              </div>
              <div className="py-4 text-[var(--foreground-secondary)] text-sm leading-relaxed">
                确定要删除这个分类吗？
                <strong className="text-[var(--error)] font-semibold">
                  分类下的所有站点也会被删除。
                </strong>
                <br />
                <span className="text-xs text-[var(--muted-foreground)]">
                  此操作无法撤销。
                </span>
              </div>
            </DialogHeader>
            <div className="flex gap-2 pt-2 border-t border-[var(--border)]">
              <Button
                variant="outline"
                onClick={() => setDeletingCategory(null)}
                className={cn(
                  "flex-1 h-11 rounded-[var(--radius-lg)]",
                  "border-[var(--border)] hover:border-[var(--border-strong)]",
                  "hover:bg-[var(--muted)]",
                  "transition-all duration-200 active:scale-95"
                )}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteCategory(deletingCategory)}
                className="flex-1 h-11 rounded-[var(--radius-lg)] font-medium transition-all duration-200 active:scale-95"
              >
                删除
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

/** 延迟显示 spinner，避免快加载时闪烁（<150ms 不显示任何内容） */
function DelayedSpinner({ delay = 150 }: { delay?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(id);
  }, [delay]);
  if (!visible) return null;
  return (
    <div className="w-8 h-8 border-4 border-[var(--foreground)] border-t-transparent rounded-full animate-spin fade-in" />
  );
}

function CategoryDialogSuspenseFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm fade-in"
         style={{ background: 'var(--scrim)' }}>
      <DelayedSpinner />
    </div>
  );
}

/**
 * 懒加载新增分类弹窗的包装器
 */
function AddCategoryDialogWrapper({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (name: string) => void;
}) {
  return (
    <Suspense fallback={<CategoryDialogSuspenseFallback />}>
      <AddCategoryDialog onClose={onClose} onConfirm={onConfirm} />
    </Suspense>
  );
}

/**
 * 暴露给父组件的方法（编辑/删除分类）
 */
export function useCategoryManagerActions() {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);

  return {
    editingCategory,
    deletingCategory,
    setEditingCategory,
    setDeletingCategory,
  };
}
