/**
 * 首页客户端交互层
 *
 * 服务端 page.tsx 通过 props 注入种子数据 (initialSites)，首屏 SSR HTML
 * 即可渲染出种子站点的 <a>（SEO 可见、爬虫可索引）。
 * 当 DataContext 拉到用户真实数据后，会自动无缝替换种子内容。
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth, useData } from "@/contexts/SitesContext";
import {
  useSitesData,
  useLoadingState,
  useErrorState,
  useCategoryOperations,
  useSitesWithUpdate,
} from "@/contexts/DataContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { SearchStatus } from "@/components/SearchBar";
import { CategoryTabBar } from "@/components/CategoryTabBar";
import { ImportExportDialog } from "@/components/ImportExportDialog";
import { SortableCategoryItem } from "@/components/SortableCategoryItem";
import type { Category } from "@/types";

// 导入拆分后的子组件和 Hooks
import {
  CategoryManager,
  ActionBar,
  EmptyState,
  KeyboardShortcuts,
  useFilteredCategories,
  useDragAndDrop,
} from "@/components/HomePage";

// DnD 相关导入
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

export default function HomeClient({ initialSites }: { initialSites: Category[] }) {
  // ✨ 优化：精准订阅，减少不必要的重渲染
  const contextSites = useSitesData();
  const loading = useLoadingState();
  const { error, clearError } = useErrorState();
  const { addCategory } = useCategoryOperations();
  const { updateSites } = useSitesWithUpdate();
  const { isGuestMode } = useAuth();

  // 首屏先用服务端注入的种子数据渲染（SEO 友好、秒开）；
  // DataContext 拉到真实数据后 contextSites 非空，自动切换为真实数据。
  const categories = contextSites.length > 0 ? contextSites : initialSites;

  // 视图模式状态
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // 导入导出对话框状态
  const [showImportExport, setShowImportExport] = useState(false);

  // 使用搜索过滤 Hook
  const { searchQuery, setSearchQuery, filteredCategories, searchResultsCount } =
    useFilteredCategories(categories);

  // 使用拖拽排序 Hook
  const { sensors, handleDragEnd, allSiteIds } = useDragAndDrop({
    categories,
    filteredCategories,
    viewMode,
    onUpdateSites: updateSites,
  });

  // 全局快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Alt + N: 新建分类
      if (
        (e.ctrlKey || e.metaKey) &&
        e.altKey &&
        !e.shiftKey &&
        e.key.toLowerCase() === "n"
      ) {
        e.preventDefault();
        // 触发自定义事件，让 CategoryManager 处理
        window.dispatchEvent(new CustomEvent("add-category"));
      }

      // Esc: 关闭所有弹窗
      if (e.key === "Escape") {
        window.dispatchEvent(new CustomEvent("close-all-dialogs"));
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isGuestMode]);

  return (
    <AppLayout>
      <PageContainer>
        {/* ========== 顶栏：sticky 吸顶 ========== */}
        <div className="sticky top-16 z-[40] -mx-4 mb-3 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--background)] px-4 py-2.5">
          {/* 左侧：分类导航 */}
          <CategoryTabBar categories={categories} />

          {/* 右侧：操作按钮组 */}
          <div className="flex flex-shrink-0 items-center gap-2 ml-auto">
            {/* 分类管理（新建、编辑、删除） */}
            <CategoryManager
              categories={categories}
              onAddCategory={addCategory}
              onUpdateSites={updateSites}
              isGuestMode={isGuestMode}
            />

            {/* 视图切换 + 更多操作菜单 */}
            <ActionBar
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onImportExport={() => setShowImportExport(true)}
            />

            {/* 搜索结果计数 */}
            {searchQuery && (
              <SearchStatus query={searchQuery} resultsCount={searchResultsCount} />
            )}
          </div>
        </div>

        {/* ========== 错误提示 ========== */}
        {error && <ErrorBanner error={error} onDismiss={clearError} />}

        {/* ========== 主内容区 ========== */}
        {filteredCategories.length === 0 ? (
          <EmptyState
            searchQuery={searchQuery}
            isGuestMode={isGuestMode}
            onClearSearch={() => setSearchQuery("")}
            loading={loading}
          />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={[
                ...filteredCategories.map((c) => c.id),
                ...allSiteIds,
              ]}
              strategy={
                viewMode === "grid"
                  ? rectSortingStrategy
                  : verticalListSortingStrategy
              }
            >
              <div className="space-y-4">
                {filteredCategories.map((category) => (
                  <SortableCategoryItem
                    key={category.id}
                    category={category}
                    onEdit={(cat) =>
                      window.dispatchEvent(
                        new CustomEvent("edit-category", { detail: cat })
                      )
                    }
                    onDelete={() =>
                      window.dispatchEvent(
                        new CustomEvent("delete-category", {
                          detail: category.id,
                        })
                      )
                    }
                    isGuestMode={isGuestMode}
                    allCategories={categories}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* ========== 快捷键提示 ========== */}
        <KeyboardShortcuts isGuestMode={isGuestMode} loading={loading} />
      </PageContainer>

      {/* ========== 导入导出对话框 ========== */}
      <ImportExportDialog open={showImportExport} onOpenChange={setShowImportExport} />
    </AppLayout>
  );
}

/**
 * 错误提示横幅组件
 */
function ErrorBanner({
  error,
  onDismiss,
}: {
  error: string;
  onDismiss: () => void;
}) {
  return (
    <div className="p-4 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-[var(--radius-lg)] text-[var(--error)] mb-4 flex items-center justify-between gap-2">
      <span>{error}</span>
      <button
        onClick={onDismiss}
        className="text-[var(--error)] hover:text-[var(--error)]/70 transition-colors p-1 cursor-pointer flex-shrink-0"
        aria-label="关闭错误提示"
      >
        ✕
      </button>
    </div>
  );
}
