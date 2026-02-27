/**
 * 添加站点卡片组件 - 现代化设计
 */

"use client";

import { Plus } from "lucide-react";
import { useState, Suspense, lazy } from "react";

// 懒加载添加站点对话框
const AddSiteDialog = lazy(() => import("./AddSiteDialog").then(m => ({ default: m.AddSiteDialog })));

interface AddSiteCardProps {
  activeCategory: string;
  onSuccess: () => void;
  view?: 'grid' | 'list';
}

export function AddSiteCard({ activeCategory, onSuccess, view = 'grid' }: AddSiteCardProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // 网格视图
  if (view === 'grid') {
    return (
      <>
        <div
          onClick={() => setIsAddDialogOpen(true)}
          className="site-card group border-dashed border-[var(--border)] bg-[var(--background-secondary)]/70 hover:border-[var(--primary-400)] hover:bg-[var(--primary-50)]/65 cursor-pointer"
          title="添加新站点"
        >
          <div className="site-icon-wrapper bg-[var(--muted)] transition-colors group-hover:bg-[var(--primary-100)]">
            <Plus className="w-4 h-4 text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--primary-600)]" />
          </div>
          <span className="site-title text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--primary-700)]">添加站点</span>
        </div>

        <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" /></div>}>
          <AddSiteDialog
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            activeCategory={activeCategory}
            onSuccess={onSuccess}
          />
        </Suspense>
      </>
    );
  }

  // 列表视图
  return (
    <>
      <div
        onClick={() => setIsAddDialogOpen(true)}
        className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--background-secondary)]/80 hover:border-[var(--primary-400)] hover:bg-[var(--primary-50)]/65 transition-all cursor-pointer"
        title="添加新站点"
      >
        <div className="w-10 h-10 flex-shrink-0 rounded-[var(--radius-md)] flex items-center justify-center bg-[var(--muted)] transition-colors">
          <Plus className="w-5 h-5 text-[var(--muted-foreground)]" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-[var(--foreground-secondary)]">添加站点</div>
          <div className="text-xs text-[var(--muted-foreground)]">点击添加新网站</div>
        </div>
      </div>

      <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" /></div>}>
        <AddSiteDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          activeCategory={activeCategory}
          onSuccess={onSuccess}
        />
      </Suspense>
    </>
  );
}
