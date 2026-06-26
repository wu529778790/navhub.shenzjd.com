/**
 * 空状态组件
 * 显示无数据或无搜索结果时的友好提示
 */

"use client";

import { Button } from "@/components/ui/button";
import { IconSearch, IconBook } from "@/components/icons";

interface EmptyStateProps {
  searchQuery: string;
  isGuestMode: boolean;
  onClearSearch: () => void;
  /** 是否仍在加载（加载中显示骨架，而非"暂无分类"，避免新用户误以为产品是空的） */
  loading?: boolean;
}

export function EmptyState({
  searchQuery,
  isGuestMode,
  onClearSearch,
  loading = false,
}: EmptyStateProps) {
  // 搜索结果为空
  if (searchQuery) {
    return (
      <div className="empty-state card p-12">
        <div className="empty-state-icon">
          <IconSearch className="w-8 h-8 text-[var(--muted-foreground)]" />
        </div>
        <div className="empty-state-title">未找到匹配内容</div>
        <div className="empty-state-description">尝试调整搜索词</div>
        <Button
          variant="outline"
          onClick={onClearSearch}
          className="mt-4"
        >
          清除搜索
        </Button>
      </div>
    );
  }

  // 加载中：显示骨架，不显示"暂无分类"
  if (loading) {
    return <LoadingSkeleton />;
  }

  // 无数据状态
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
          <span className="kbd">Ctrl/Cmd</span> + <span className="kbd">Alt</span>{" "}
          + <span className="kbd">N</span> 快速新建
        </div>
      )}
    </div>
  );
}

/**
 * 首屏加载骨架（复用项目既有的 animate-pulse 风格）
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="加载中">
      <div className="card p-4">
        {/* 分类标题占位 */}
        <div className="h-5 w-28 rounded-[var(--radius-md)] bg-[var(--muted)] animate-pulse mb-4" />
        {/* 站点网格占位 */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square w-full rounded-[var(--radius-md)] bg-[var(--muted)] animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
