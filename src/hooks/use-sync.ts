/**\n * 同步状态 Hook\n * 管理同步状态和网络状态\n */

"use client";

import { useState, useEffect, useCallback } from "react";
import { SyncManager, SyncStatus, initialSync, manualSync as manualSyncFn } from "@/lib/storage/sync-manager";
import type { NavData } from "@/lib/storage/local-storage";

interface UseSyncReturn {
  status: SyncStatus;
  isOnline: boolean;
  lastSync: Date | null;
  sync: (data: NavData) => void;
  syncNow: (data: NavData) => Promise<void>;
  manualSync: () => Promise<void>;
  refresh: () => Promise<NavData | null>;
  setToken: (token: string) => void;
}

/**
 * 同步状态 Hook
 */
export function useSync(token?: string): UseSyncReturn {
  const [status, setStatus] = useState<SyncStatus>(SyncStatus.IDLE);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncManager, setSyncManager] = useState<SyncManager | null>(null);
  const [currentToken, setCurrentToken] = useState<string | undefined>(token);

  // 初始化同步管理器
  useEffect(() => {
    const manager = new SyncManager({
      token: currentToken,
      onSuccess: () => {
        setLastSync(new Date());
      },
      onError: (error) => {
        console.error("Sync error:", error);
      },
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
      },
    });

    setSyncManager(manager);

    return () => {
      manager.destroy();
    };
  }, [currentToken]);

  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setStatus(SyncStatus.IDLE);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatus(SyncStatus.OFFLINE);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 初始检查
    setIsOnline(navigator.onLine);
    if (!navigator.onLine) {
      setStatus(SyncStatus.OFFLINE);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 获取最后同步时间
  useEffect(() => {
    const lastSyncTime = localStorage.getItem("nav_last_sync");
    if (lastSyncTime) {
      setLastSync(new Date(parseInt(lastSyncTime)));
    }
  }, []);

  /**
   * 同步数据（防抖）
   */
  const sync = useCallback((data: NavData) => {
    if (!isOnline) {
      setStatus(SyncStatus.OFFLINE);
      return;
    }

    if (syncManager) {
      syncManager.sync(data);
    }
  }, [syncManager, isOnline]);

  /**
   * 立即同步
   */
  const syncNow = useCallback(async (data: NavData) => {
    if (!isOnline) {
      throw new Error("当前离线，无法同步");
    }

    if (syncManager) {
      await syncManager.syncNow(data);
      setLastSync(new Date());
    }
  }, [syncManager, isOnline]);

  /**
   * 手动同步
   */
  const handleManualSync = useCallback(async () => {
    if (!isOnline) {
      throw new Error("当前离线，无法同步");
    }

    if (!currentToken) {
      throw new Error("未认证用户");
    }

    await manualSyncFn(currentToken);
    setLastSync(new Date());
  }, [isOnline, currentToken]);

  /**
   * 刷新数据（从 GitHub 拉取）
   */
  const refresh = useCallback(async (): Promise<NavData | null> => {
    if (!isOnline) {
      // 离线时返回本地数据
      const localData = localStorage.getItem("nav_data");
      return localData ? JSON.parse(localData) : null;
    }

    try {
      const data = await initialSync(currentToken);
      if (data) {
        setLastSync(new Date());
      }
      return data;
    } catch (error) {
      console.error("刷新失败:", error);
      // 返回本地数据作为 fallback
      const localData = localStorage.getItem("nav_data");
      return localData ? JSON.parse(localData) : null;
    }
  }, [isOnline, currentToken]);

  /**
   * 设置 Token
   */
  const setToken = useCallback((token: string) => {
    setCurrentToken(token);
  }, []);

  return {
    status,
    isOnline,
    lastSync,
    sync,
    syncNow,
    manualSync: handleManualSync,
    refresh,
    setToken,
  };
}
