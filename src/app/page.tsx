/**
 * 主页 - 站点列表和管理
 */

"use client";

import { useState } from "react";
import { useSites } from "@/contexts/SitesContext";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SortableSites } from "@/components/SortableSites";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { AddCategoryDialog } from "@/components/AddCategoryDialog";

export default function Home() {
  const {
    sites: categories,
    loading,
    error,
    refreshSites,
    isGuestMode,
    addCategory,
  } = useSites();
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);

  return (
    <AppLayout>
      <PageContainer
        title="我的导航"
        description="管理你的站点分类和链接"
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
          /* 分类列表 */
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
                      {category.name}
                    </h3>
                    <span className="badge badge-neutral">
                      {category.sites.length} 个站点
                    </span>
                  </div>
                </div>

                <SortableSites
                  category={category}
                  allCategories={categories}
                  onSiteChange={refreshSites}
                />
              </div>
            ))}
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
              icon: "📁",
              sort: categories.length,
              sites: [],
            });
            setShowAddCategoryDialog(false);
          }}
        />
      )}
    </AppLayout>
  );
}
