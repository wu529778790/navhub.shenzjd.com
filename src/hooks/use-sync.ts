/**\n * 同步状态 Hook\n * 管理同步状态和网络状态\n */

"use client";

import { useState, useEffect, useCallback } from "react";
import { SyncManager, SyncStatus, initialSync, manualSync as manualSyncFn } from "@/lib/storage/sync-manager";
import type { NavData } from "@/lib/storage/local-storage";
import { getAuthState } from "@/lib/auth";

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

  // 从 localStorage 获取最新的认证状态
  const getLatestToken = useCallback(() => {
    const auth = getAuthState();
    return auth.token;
  }, []);

  // 当 token 参数变化或需要刷新认证状态时更新 currentToken
  useEffect(() => {
    const latestToken = getLatestToken();
    setCurrentToken(latestToken || token);
  }, [token, getLatestToken]);

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
   * 注意：这个函数依赖 syncManager，syncManager 会在 currentToken 变化时更新
   */
  const sync = useCallback((data: NavData) => {
    if (!isOnline) {
      setStatus(SyncStatus.OFFLINE);
      return;
    }

    // 每次同步时检查是否有 token
    const latestToken = getLatestToken();
    if (!latestToken) {
      setStatus(SyncStatus.IDLE); // 没有 token，不进行 GitHub 同步
      return;
    }

    // 如果 syncManager 的 token 不匹配，需要重新创建
    if (syncManager) {
      syncManager.sync(data);
    }
  }, [syncManager, isOnline, getLatestToken]);

  /**
   * 立即同步
   */
  const syncNow = useCallback(async (data: NavData) => {
    if (!isOnline) {
      throw new Error("当前离线，无法同步");
    }

    const latestToken = getLatestToken();
    if (!latestToken) {
      throw new Error("未认证用户");
    }

    // 使用最新的 token 立即同步
    await manualSyncFn(latestToken);
    setLastSync(new Date());
  }, [isOnline, getLatestToken]);

  /**
   * 手动同步
   */
  const handleManualSync = useCallback(async () => {
    if (!isOnline) {
      throw new Error("当前离线，无法同步");
    }

    // 每次执行时都重新获取最新的 token
    const latestToken = getLatestToken();
    const tokenToUse = latestToken || currentToken || token;

    if (!tokenToUse) {
      throw new Error("未认证用户");
    }

    await manualSyncFn(tokenToUse);
    setLastSync(new Date());
  }, [isOnline, getLatestToken, currentToken, token]);

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
      // 每次刷新时都重新获取最新的 token
      const latestToken = getLatestToken();
      const tokenToUse = latestToken || currentToken || token;
      const data = await initialSync(tokenToUse);
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
  }, [isOnline, getLatestToken, currentToken, token]);

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
