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

  useEffect(() => {
    const auth = getAuthState();
    setIsLoggedIn(!!auth.token);
    setMounted(true);
  }, []);

  if (!mounted || isGuestMode) {
    return null;
  }

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

  const getStatusText = () => {
    if (!isOnline) return "离线";
    if (syncStatus === "🟡") return "同步中";
    if (syncStatus === "⬆️") return "上传中";
    if (syncStatus === "⬇️") return "下载中";
    if (syncStatus === "⚠️") return "冲突";
    if (syncStatus === "🔴") return "同步错误";
    return isLoggedIn ? "在线" : "待同步";
  };

  const handleManualSync = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    setSyncMessage(null);

    try {
      const result = await manualSync();

      if (!result.success) {
        showToast(result.error || "同步失败", "error", 3000);
        setIsSyncing(false);
        return;
      }

      let successMsg = "同步成功";
      if (result.direction === "upload") successMsg = "📤 " + (result.message || "上传成功");
      else if (result.direction === "download") successMsg = "📥 " + (result.message || "下载成功");
      else if (result.direction === "none") successMsg = "✅ " + (result.message || "数据已同步");

      showToast(successMsg, "success", 3000);
      setSyncMessage(result.message || "");
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (error: unknown) {
      const typedError = error as Error;
      let errorMsg = typedError?.message || "同步失败";
      if (errorMsg === "未认证用户") errorMsg = "请先登录 GitHub";
      else if (errorMsg === "当前离线，无法同步") errorMsg = "当前离线，无法同步";
      else if (errorMsg === "没有本地数据可同步") errorMsg = "没有数据可同步";
      showToast(errorMsg, "error", 3000);
      setSyncMessage(null);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="hidden items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-1.5 text-[var(--foreground-secondary)] md:flex">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${isOnline ? "bg-[var(--success)]" : "bg-[var(--warning)]"}`} />
        <span className="font-semibold">{getStatusText()}</span>
        {lastSync && <span className="text-[var(--muted-foreground)]">{formatLastSync()}</span>}
        {syncMessage && <span className="hidden text-[var(--primary-600)] lg:inline">({syncMessage})</span>}
      </div>

      {isOnline && isLoggedIn && !isGuestMode && (
        <Button
          onClick={handleManualSync}
          size="sm"
          disabled={isSyncing}
          className="flex items-center gap-1"
          title="双向同步：上传本地数据或下载 GitHub 数据"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "同步中..." : "同步"}
        </Button>
      )}
    </div>
  );
}
