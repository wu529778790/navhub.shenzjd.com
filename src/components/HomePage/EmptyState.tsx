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
}

export function EmptyState({
  searchQuery,
  isGuestMode,
  onClearSearch,
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
