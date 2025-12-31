/**
 * 分类管理页面
 */

"use client";

import { useState } from "react";
import { useSites } from "@/contexts/SitesContext";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, GripVertical } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { AddCategoryDialog } from "@/components/AddCategoryDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function CategoriesPage() {
  const { sites: categories, updateSites, isGuestMode, addCategory } = useSites();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);

  // 添加分类
  const handleAddCategory = (name: string) => {
    addCategory({
      id: `cat_${Date.now()}`,
      name: name.trim(),
      icon: "📁",
      sort: categories.length,
      sites: [],
    });
    setShowAddDialog(false);
  };

  // 编辑分类
  const handleEditCategory = () => {
    if (!editingCategory || !editingCategory.name.trim()) return;

    const newCategories = categories.map((c) =>
      c.id === editingCategory.id
        ? { ...c, name: editingCategory.name.trim() }
        : c
    );
    updateSites(newCategories);
    setEditingCategory(null);
  };

  // 删除分类
  const handleDeleteCategory = (categoryId: string) => {
    const newCategories = categories.filter((c) => c.id !== categoryId);
    updateSites(newCategories);
    setDeletingCategory(null);
  };

  return (
    <AppLayout>
      <PageContainer
        title="分类管理"
        description="创建、编辑和删除分类"
        action={
          !isGuestMode && (
            <Button
              size="sm"
              onClick={() => setShowAddDialog(true)}
              className="gap-1"
            >
              <Plus className="w-4 h-4" />
              添加分类
            </Button>
          )
        }
      >
        {categories.length === 0 ? (
          <div className="empty-state card p-8">
            <div className="empty-state-icon">
              <Plus className="w-8 h-8 text-neutral-400" />
            </div>
            <div className="empty-state-title">暂无分类</div>
            <div className="empty-state-description">
              {isGuestMode
                ? "请登录后管理分类"
                : "点击右上角的按钮添加第一个分类"}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((category, index) => (
              <div
                key={category.id}
                className="card p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 flex-1">
                  <GripVertical className="w-4 h-4 text-neutral-400 cursor-move" />
                  <div>
                    <div className="font-medium text-neutral-900 dark:text-neutral-100">
                      {category.name}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {category.sites.length} 个站点
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isGuestMode && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingCategory({ id: category.id, name: category.name })}
                        className="px-2"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingCategory(category.id)}
                        className="px-2 text-error hover:bg-error/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </PageContainer>

      {/* 添加分类对话框 */}
      {showAddDialog && (
        <AddCategoryDialog
          onClose={() => setShowAddDialog(false)}
          onConfirm={handleAddCategory}
        />
      )}

      {/* 编辑分类对话框 */}
      {editingCategory && (
        <Dialog open onOpenChange={() => setEditingCategory(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑分类</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={editingCategory.name}
                onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEditCategory();
                  if (e.key === "Escape") setEditingCategory(null);
                }}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingCategory(null)}>
                取消
              </Button>
              <Button onClick={handleEditCategory}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 删除确认对话框 */}
      {deletingCategory && (
        <Dialog open onOpenChange={() => setDeletingCategory(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认删除</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-sm text-neutral-600 dark:text-neutral-400">
              确定要删除这个分类吗？分类下的所有站点也会被删除。
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeletingCategory(null)}>
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteCategory(deletingCategory)}
              >
                删除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
}
