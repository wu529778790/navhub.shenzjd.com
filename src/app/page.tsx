/**
 * 主页 - 站点列表和管理，支持分类拖拽排序和点击编辑
 */

"use client";

import { useState } from "react";
import { useSites } from "@/contexts/SitesContext";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, GripVertical } from "lucide-react";
import { SortableSites } from "@/components/SortableSites";
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

// DnD Kit imports for category sorting
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableCategoryItemProps {
  category: any;
  onEdit: (category: any) => void;
  onDelete: (id: string) => void;
  isGuestMode: boolean;
  allCategories: any[];
  onSiteChange: () => void;
}

function SortableCategoryItem({ category, onEdit, onDelete, isGuestMode, allCategories, onSiteChange }: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="card p-4"
    >
      {/* 分类标题栏 - 支持拖拽和点击编辑 */}
      <div
        className="flex items-center justify-between mb-3 cursor-move p-2 -mx-2 -mt-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center gap-3 flex-1">
          <GripVertical className="w-4 h-4 text-neutral-400" />
          <div
            className="flex-1 cursor-pointer"
            onClick={() => !isGuestMode && onEdit(category)}
          >
            <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              {category.name}
            </h3>
            <span className="badge badge-neutral">
              {category.sites.length} 个站点
            </span>
          </div>
        </div>

        {!isGuestMode && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(category);
              }}
              className="px-2"
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
              className="px-2 text-error hover:bg-error/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* 站点列表 */}
      <SortableSites
        category={category}
        allCategories={allCategories}
        onSiteChange={onSiteChange}
      />
    </div>
  );
}

export default function Home() {
  const {
    sites: categories,
    loading,
    error,
    refreshSites,
    isGuestMode,
    addCategory,
    updateSites,
  } = useSites();
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);

  // DnD Sensors for category sorting
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

  // 分类拖拽排序
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);

    const newCategories = arrayMove(categories, oldIndex, newIndex);
    updateSites(newCategories);
  };

  return (
    <AppLayout>
      <PageContainer
        title="我的导航"
        description="拖拽标题可排序分类，点击标题可编辑"
        action={
          !isGuestMode && (
            <Button
              size="sm"
              onClick={() => setShowAddCategoryDialog(true)}
              className="gap-1"
            >
              <Plus className="w-4 h-4" />
              添加分类
            </Button>
          )
        }
      >
        {/* 错误提示 */}
        {error && (
          <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-error">
            {error}
          </div>
        )}

        {/* 加载状态 */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-4 bg-neutral-200 rounded mb-2"></div>
                <div className="h-3 bg-neutral-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          /* 空状态 */
          <div className="empty-state card p-8">
            <div className="empty-state-icon">
              <Plus className="w-8 h-8 text-neutral-400" />
            </div>
            <div className="empty-state-title">暂无分类</div>
            <div className="empty-state-description">
              {isGuestMode
                ? "请登录后添加分类"
                : "点击右上角的按钮添加第一个分类"}
            </div>
          </div>
        ) : (
          /* 分类列表 - 支持拖拽排序 */
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={categories.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {categories.map((category) => (
                  <SortableCategoryItem
                    key={category.id}
                    category={category}
                    onEdit={setEditingCategory}
                    onDelete={() => setDeletingCategory(category.id)}
                    isGuestMode={isGuestMode}
                    allCategories={categories}
                    onSiteChange={refreshSites}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </PageContainer>

      {/* 添加分类对话框 */}
      {showAddCategoryDialog && (
        <AddCategoryDialog
          onClose={() => setShowAddCategoryDialog(false)}
          onConfirm={(name) => {
            addCategory({
              id: `cat_${Date.now()}`,
              name: name.trim(),
              icon: "📁",
              sort: categories.length,
              sites: [],
            });
            setShowAddCategoryDialog(false);
          }}
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
