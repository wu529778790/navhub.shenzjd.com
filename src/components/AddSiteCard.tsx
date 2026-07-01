/**
 * 添加站点卡片组件 - 现代化设计
 */

"use client";

import { Plus } from "lucide-react";
import { useState, useEffect, useTransition, Suspense, lazy } from "react";

// 懒加载添加站点对话框
const AddSiteDialog = lazy(() =>
  import("./AddSiteDialog").then((m) => ({ default: m.AddSiteDialog }))
);

/**
 * 延迟显示 spinner：加载 <200ms 时不显示任何内容（避免快加载时 spinner 闪烁），
 * 超过 200ms 后才淡入 spinner，告知用户"正在加载"。
 */
function DelayedSpinner({ delay = 200 }: { delay?: number }) {
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

/** Dialog 加载的 Suspense fallback */
function DialogFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm fade-in"
         style={{ background: 'var(--scrim)' }}>
      <DelayedSpinner />
    </div>
  );
}

interface AddSiteCardProps {
  activeCategory: string;
  onSuccess?: () => void;
  view?: "grid" | "list";
}

export function AddSiteCard({ activeCategory, onSuccess, view = "grid" }: AddSiteCardProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  // startTransition 让点击打开不阻塞，Dialog 动画可以自然过渡
  const [, startTransition] = useTransition();
  const handleOpen = () => {
    startTransition(() => {
      setIsAddDialogOpen(true);
    });
  };

  // 网格视图
  if (view === "grid") {
    return (
      <>
        <div
          onClick={handleOpen}
          className="site-card group border-dashed border-[var(--border)] bg-[var(--background-secondary)]/70 hover:border-[var(--primary-400)] hover:bg-[var(--primary-50)]/65 cursor-pointer"
          title="添加新站点"
        >
          <div className="site-icon-wrapper bg-[var(--muted)] transition-colors group-hover:bg-[var(--primary-100)]">
            <Plus className="w-4 h-4 text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--primary-600)]" />
          </div>
          <span className="site-title text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--primary-700)]">
            添加站点
          </span>
        </div>

        <Suspense fallback={<DialogFallback />}>
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
        onClick={handleOpen}
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

      <Suspense
        fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ background: 'var(--scrim)' }}>
            <div className="w-8 h-8 border-4 border-[var(--foreground)] border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
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
