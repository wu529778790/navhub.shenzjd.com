/**
 * 同步状态指示器组件
 */

"use client";

import { useSites } from "@/contexts/SitesContext";
import { Button } from "@/components/ui/button";

export function SyncStatus() {
  const { syncStatus, isOnline, lastSync, manualSync } = useSites();

  // 格式化最后同步时间
  const formatLastSync = () => {
    if (!lastSync) return "从未同步";
    const now = new Date();
    const diff = now.getTime() - lastSync.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "刚刚同步";
    if (minutes < 60) return `${minutes}分钟前同步`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前同步`;
    return lastSync.toLocaleDateString();
  };

  // 获取状态文本
  const getStatusText = () => {
    if (!isOnline) return "⚪ 离线";
    if (syncStatus === "🟡") return "🟡 同步中";
    if (syncStatus === "🔴") return "🔴 同步错误";
    return "🟢 在线";
  };

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
        <span title={isOnline ? "在线" : "离线"}>
          {getStatusText()}
        </span>
        {lastSync && (
          <span className="text-muted-foreground hidden sm:inline">
            {formatLastSync()}
          </span>
        )}
      </div>

      {/* 手动同步按钮 */}
      {isOnline && (
        <Button
          onClick={manualSync}
          size="sm"
          title="手动同步到 GitHub"
        >
          同步
        </Button>
      )}
    </div>
  );
}
