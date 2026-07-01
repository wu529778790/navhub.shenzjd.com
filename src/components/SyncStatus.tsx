/**
 * 同步状态指示器组件
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { manualSync as doManualSync } from "@/lib/storage/sync-manager";
import { getAuthState } from "@/lib/auth";
import { getLastSyncTime } from "@/lib/storage/local-storage";

export function SyncStatus() {
  const { isGuestMode } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStatus] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  // 监听网络状态
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 加载最后同步时间
  useEffect(() => {
    try {
      const time = getLastSyncTime();
      if (time) setLastSync(new Date(time));
    } catch {
      // ignore
    }
  }, []);

  const manualSync = useCallback(async (): Promise<{ success: boolean; message?: string; direction: string; error?: string }> => {
    try {
      const auth = await getAuthState();
      if (!auth.token) {
        return { success: false, direction: "none", error: "未认证用户" };
      }
      return await doManualSync(auth.token);
    } catch (error) {
      return { success: false, direction: "none", error: error instanceof Error ? error.message : "同步失败" };
    }
  }, []);

  if (!mounted) return null;

  const isLoggedIn = !isGuestMode;

  const formatLastSync = (lastSyncTime: Date) => {
    const now = new Date();
    const diff = now.getTime() - lastSyncTime.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "刚刚同步";
    if (minutes < 60) return `${minutes}分钟前同步`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前同步`;
    return lastSyncTime.toLocaleDateString();
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
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${isOnline ? "bg-[var(--success)]" : "bg-[var(--warning)]"}`}
        />
        <span className="font-semibold">{getStatusText()}</span>
        {lastSync && <span className="text-[var(--muted-foreground)]">{formatLastSync(lastSync)}</span>}
        {syncMessage && (
          <span className="hidden text-[var(--primary-600)] lg:inline">({syncMessage})</span>
        )}
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
