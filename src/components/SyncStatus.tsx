/**
 * 同步状态指示器组件
 */

"use client";

import { useState, useEffect } from "react";
import { useSites } from "@/contexts/SitesContext";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { showToast } from "@/components/Toast";
import { getAuthState } from "@/lib/auth";

export function SyncStatus() {
  const { syncStatus, isOnline, lastSync, manualSync, isGuestMode } = useSites();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 检查是否已登录 - 只在客户端执行
  useEffect(() => {
    const auth = getAuthState();
    setIsLoggedIn(!!auth.token);
    setMounted(true);
  }, []);

  // 访客模式不显示任何内容 - 在客户端渲染后才检查
  if (!mounted || isGuestMode) {
    return null;
  }

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
    if (syncStatus === "⬆️") return "⬆️ 上传中";
    if (syncStatus === "⬇️") return "⬇️ 下载中";
    if (syncStatus === "⚠️") return "⚠️ 冲突";
    if (syncStatus === "🔴") return "🔴 同步错误";
    // 已登录显示在线，未登录显示待同步
    return isLoggedIn ? "🟢 在线" : "⚪ 待同步";
  };

  // 处理同步点击 - 双向同步
  const handleManualSync = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    setSyncMessage(null);

    try {
      const result = await manualSync();

      // 如果同步失败，显示错误消息
      if (!result.success) {
        if (result.error) {
          showToast(result.error, "error", 3000);
        } else {
          showToast("同步失败", "error", 3000);
        }
        setIsSyncing(false);
        return;
      }

      // 根据同步方向显示不同的成功消息
      let successMsg = "同步成功";
      if (result.direction === "upload") {
        successMsg = "📤 " + (result.message || "上传成功");
      } else if (result.direction === "download") {
        successMsg = "📥 " + (result.message || "下载成功");
      } else if (result.direction === "none") {
        successMsg = "✅ " + (result.message || "数据已同步");
      }

      showToast(successMsg, "success", 3000);
      setSyncMessage(result.message || "");

      // 3秒后清除消息
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (error: unknown) {
      const typedError = error as Error;
      // 友好的错误提示
      let errorMsg = typedError?.message || '同步失败';
      if (errorMsg === '未认证用户') {
        errorMsg = '请先登录 GitHub';
      } else if (errorMsg === '当前离线，无法同步') {
        errorMsg = '当前离线，无法同步';
      } else if (errorMsg === '没有本地数据可同步') {
        errorMsg = '没有数据可同步';
      }
      showToast(errorMsg, "error", 3000);
      setSyncMessage(null);
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
        {/* 同步消息提示 */}
        {syncMessage && (
          <span className="text-blue-600 dark:text-blue-400 hidden md:inline">
            ({syncMessage})
          </span>
        )}
      </div>

      {/* 同步按钮 - 访客模式不显示 */}
      {isOnline && isLoggedIn && !isGuestMode && (
        <Button
          onClick={handleManualSync}
          size="sm"
          disabled={isSyncing}
          className="flex items-center gap-1"
          title="双向同步：上传本地数据或下载 GitHub 数据"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? '同步中...' : '同步'}
        </Button>
      )}
    </div>
  );
}
