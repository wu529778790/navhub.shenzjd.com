/**
 * 同步状态指示器组件
 */

"use client";

import { useState } from "react";
import { useSites } from "@/contexts/SitesContext";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { showToast } from "@/components/Toast";

export function SyncStatus() {
  const { syncStatus, isOnline, lastSync, manualSync } = useSites();
  const [isSyncing, setIsSyncing] = useState(false);

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

  // 处理同步点击
  const handleManualSync = async () => {
    if (isSyncing) return;

    setIsSyncing(true);

    try {
      await manualSync();
      showToast("同步成功", "success", 2000);
    } catch (error: any) {
      // 友好的错误提示
      let errorMsg = error?.message || '同步失败';
      if (errorMsg === '未认证用户') {
        errorMsg = '请先登录 GitHub';
      } else if (errorMsg === '当前离线，无法同步') {
        errorMsg = '当前离线，无法同步';
      }
      showToast(errorMsg, "error", 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-3 text-sm">
      {/* 状态指示器 */}
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

      {/* 同步按钮 */}
      {isOnline && (
        <Button
          onClick={handleManualSync}
          size="sm"
          disabled={isSyncing}
          className="flex items-center gap-1"
          title="手动同步到 GitHub"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? '同步中...' : '同步'}
        </Button>
      )}
    </div>
  );
}
