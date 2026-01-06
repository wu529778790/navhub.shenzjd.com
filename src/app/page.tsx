/**
 * 现代化主页 - 站点导航和管理界面
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useSites } from "@/contexts/SitesContext";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, GripVertical, Keyboard } from "lucide-react";
import { IconFolder, IconSearch, IconBook } from "@/components/icons";
import { SortableSites } from "@/components/SortableSites";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { AddCategoryDialog } from "@/components/AddCategoryDialog";
import { SearchBar, SearchStatus, CategoryFilter, ViewToggle } from "@/components/SearchBar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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

interface SimpleSite {
  id: string;
  title: string;
  url: string;
  favicon: string;
  sort?: number;
}

interface SimpleCategory {
  id: string;
  name: string;
  icon?: string;
  sort: number;
  sites: SimpleSite[];
}

interface SortableCategoryItemProps {
  category: SimpleCategory;
  onEdit: (category: SimpleCategory) => void;
  onDelete: (id: string) => void;
  isGuestMode: boolean;
  allCategories: SimpleCategory[];
  onSiteChange: () => void;
  viewMode: 'grid' | 'list';
}

function SortableCategoryItem({ category, onEdit, onDelete, isGuestMode, allCategories, onSiteChange, viewMode }: SortableCategoryItemProps) {
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

  // 分类点击 - 锚点跳转
  const handleCategoryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(`category-${category.id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // 更新 URL hash
      window.history.pushState(null, '', `#category-${category.id}`);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="category-card p-5"
      id={`category-${category.id}`}
    >
      {/* 分类标题栏 - 支持拖拽和点击编辑 */}
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
          <div className="flex items-center gap-1">
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

      {/* 站点列表 */}
      <SortableSites
        category={category}
        allCategories={allCategories}
        onSiteChange={onSiteChange}
        view={viewMode}
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

  // UI 状态
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SimpleCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);

  // 搜索状态
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // DnD Sensors for category sorting
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N: 新建分类
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        if (!isGuestMode) setShowAddCategoryDialog(true);
      }

      // Escape: 关闭所有对话框
      if (e.key === "Escape") {
        setShowAddCategoryDialog(false);
        setEditingCategory(null);
        setDeletingCategory(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isGuestMode]);

  // 搜索逻辑 - 仅按搜索词过滤
  const filteredCategories = useMemo(() => {
    let result = categories as SimpleCategory[];

    // 按搜索词过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const filtered: SimpleCategory[] = [];

      for (const category of result) {
        // 检查分类名称
        const categoryMatches = category.name.toLowerCase().includes(query);

        // 检查站点
        const matchingSites = category.sites.filter(site =>
          site.title.toLowerCase().includes(query) ||
          site.url.toLowerCase().includes(query)
        );

        if (categoryMatches || matchingSites.length > 0) {
          filtered.push({
            ...category,
            sites: matchingSites.length > 0 ? matchingSites : category.sites
          });
        }
      }

      result = filtered;
    }

    return result;
  }, [categories, searchQuery]);

  // 搜索结果统计
  const searchResultsCount = useMemo(() => {
    return filteredCategories.reduce((sum, cat) => sum + cat.sites.length, 0);
  }, [filteredCategories]);

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

  // 空状态处理
  const renderEmptyState = () => {
    if (searchQuery) {
      return (
        <div className="empty-state card p-12">
          <div className="empty-state-icon">
            <IconSearch className="w-8 h-8 text-[var(--muted-foreground)]" />
          </div>
          <div className="empty-state-title">未找到匹配内容</div>
          <div className="empty-state-description">
            尝试调整搜索词
          </div>
          <Button
            variant="outline"
            onClick={() => setSearchQuery("")}
            className="mt-4"
          >
            清除搜索
          </Button>
        </div>
      );
    }

    return (
      <div className="empty-state card p-12">
        <div className="empty-state-icon">
          <IconBook className="w-8 h-8 text-[var(--muted-foreground)]" />
        </div>
        <div className="empty-state-title">暂无分类</div>
        <div className="empty-state-description">
          {isGuestMode
            ? "请登录后添加分类和站点"
            : "点击下方的按钮添加第一个分类，开始管理你的导航"}
        </div>
        {!isGuestMode && (
          <div className="mt-4 text-xs text-[var(--muted-foreground)]">
            <span className="kbd">Ctrl</span> + <span className="kbd">N</span> 快速新建
          </div>
        )}
      </div>
    );
  };

  return (
    <AppLayout>
      <PageContainer>
        {/* 搜索和工具栏 */}
        <div className="flex flex-col gap-4 mb-6 w-full">
          {/* 搜索栏 + 新建按钮 */}
          <div className="flex gap-3 items-center w-full flex-wrap">
            <div className="flex-1 min-w-0 flex-grow">
              <SearchBar
                onSearch={setSearchQuery}
                placeholder="搜索站点名称、URL..."
              />
            </div>

            {/* 视图切换 */}
            <ViewToggle view={viewMode} onViewChange={setViewMode} />

            {/* 新建按钮 - 移到搜索栏右侧 */}
            {!isGuestMode && (
              <Button
                size="sm"
                onClick={() => setShowAddCategoryDialog(true)}
                className="gap-1 shadow-md hover:shadow-lg transition-all flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                新建
                <span className="hidden sm:inline text-xs opacity-75 ml-1">
                  (Ctrl+N)
                </span>
              </Button>
            )}
          </div>

          {/* 搜索状态栏 */}
          {searchQuery && (
            <div className="flex items-center justify-between gap-3 flex-wrap w-full">
              <SearchStatus query={searchQuery} resultsCount={searchResultsCount} />
            </div>
          )}
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="p-4 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-[var(--radius-lg)] text-[var(--error)] mb-4">
            {error}
          </div>
        )}

        {/* 加载状态 */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="category-card p-5 animate-pulse">
                <div className="h-6 bg-[var(--muted)] rounded-[var(--radius-sm)] mb-4 w-1/3"></div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 mt-2 w-full">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="w-[100px] h-[100px] bg-[var(--muted)] rounded-[var(--radius-md)] flex-shrink-0"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          renderEmptyState()
        ) : (
          /* 分类列表 - 支持拖拽排序 */
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredCategories.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {filteredCategories.map((category) => (
                  <SortableCategoryItem
                    key={category.id}
                    category={category}
                    onEdit={setEditingCategory}
                    onDelete={() => setDeletingCategory(category.id)}
                    isGuestMode={isGuestMode}
                    allCategories={categories}
                    onSiteChange={refreshSites}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* 快捷键提示 - 底部固定提示 */}
        {!isGuestMode && !loading && (
          <div className="mt-8 p-4 bg-[var(--background-secondary)] rounded-[var(--radius-lg)] border border-[var(--border)]">
            <div className="flex items-center gap-2 text-sm text-[var(--foreground-secondary)] mb-2">
              <Keyboard className="w-4 h-4" />
              <span className="font-medium">快捷键</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[var(--muted-foreground)]">
              <div className="flex items-center gap-2">
                <span className="kbd">Ctrl</span> + <span className="kbd">K</span>
                <span>快速搜索</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="kbd">Ctrl</span> + <span className="kbd">N</span>
                <span>新建分类</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="kbd">Esc</span>
                <span>关闭对话框</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="kbd">拖拽</span>
                <span>排序分类和站点</span>
              </div>
            </div>
          </div>
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">编辑分类</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground-secondary)]">分类名称</label>
                <Input
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEditCategory();
                    if (e.key === "Escape") setEditingCategory(null);
                  }}
                  placeholder="输入分类名称"
                  autoFocus
                  className={cn(
                    "h-12 rounded-[var(--radius-lg)]",
                    "bg-[var(--background)]/80 backdrop-blur-sm",
                    "border-[var(--border)] hover:border-[var(--primary-400)]",
                    "focus:border-[var(--primary-500)] focus:ring-2 focus:ring-[var(--primary-500)]/20"
                  )}
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
                  "hover:bg-[var(--background-secondary)]",
                  "transition-all duration-200 active:scale-95"
                )}
              >
                取消
              </Button>
              <Button
                onClick={handleEditCategory}
                className={cn(
                  "flex-1 h-11 rounded-[var(--radius-lg)]",
                  "bg-gradient-to-r from-[var(--primary-600)] to-[var(--primary-500)]",
                  "hover:from-[var(--primary-700)] hover:to-[var(--primary-600)]",
                  "text-white font-medium shadow-lg shadow-[var(--primary-500)]/20",
                  "transition-all duration-200 active:scale-95"
                )}
              >
                保存
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 删除确认对话框 */}
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
                确定要删除这个分类吗？<strong className="text-[var(--error)] font-semibold">分类下的所有站点也会被删除。</strong>
                <br />
                <span className="text-xs text-[var(--muted-foreground)]">此操作无法撤销。</span>
              </div>
            </DialogHeader>
            <div className="flex gap-2 pt-2 border-t border-[var(--border)]">
              <Button
                variant="outline"
                onClick={() => setDeletingCategory(null)}
                className={cn(
                  "flex-1 h-11 rounded-[var(--radius-lg)]",
                  "border-[var(--border)] hover:border-[var(--border-strong)]",
                  "hover:bg-[var(--background-secondary)]",
                  "transition-all duration-200 active:scale-95"
                )}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteCategory(deletingCategory)}
                className={cn(
                  "flex-1 h-11 rounded-[var(--radius-lg)]",
                  "bg-gradient-to-r from-[var(--error)] to-red-600",
                  "hover:from-red-600 hover:to-red-700",
                  "text-white font-medium shadow-lg shadow-red-500/30",
                  "transition-all duration-200 active:scale-95"
                )}
              >
                删除
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
}
