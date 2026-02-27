/**\n * 同步状态 Hook\n * 管理同步状态和网络状态\n */
"use client";

import { useState, useEffect, useCallback } from "react";
import { SyncManager, SyncStatus, initialSync, manualSync as manualSyncFn, type SyncResult, type SyncStepInfo } from "@/lib/storage/sync-manager";
import type { NavData } from "@/lib/storage/local-storage";

interface UseSyncReturn {
  status: SyncStatus;
  isOnline: boolean;
  lastSync: Date | null;
  syncStep: SyncStepInfo | null;
  sync: (data: NavData) => void;
  syncNow: (data: NavData) => Promise<void>;
  manualSync: () => Promise<SyncResult>;  // 返回同步结果
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
  const [syncStep, setSyncStep] = useState<SyncStepInfo | null>(null);
  const [syncManager, setSyncManager] = useState<SyncManager | null>(null);
  const [currentToken, setCurrentToken] = useState<string | undefined>(token);

  // 当 token 参数变化或需要刷新认证状态时更新 currentToken
  useEffect(() => {
    setCurrentToken(token);
  }, [token]);

  // 初始化同步管理器
  useEffect(() => {
    const manager = new SyncManager({
      token: currentToken,
      onSuccess: () => {
        setLastSync(new Date());
        setSyncStep(null);
      },
      onError: (error) => {
        console.error("Sync error:", error);
        setSyncStep(null);
      },
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
      },
      onStepChange: (stepInfo) => {
        setSyncStep(stepInfo);
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

    if (!currentToken) {
      setStatus(SyncStatus.IDLE); // 没有 token，不进行 GitHub 同步
      return;
    }

    // 如果 syncManager 的 token 不匹配，需要重新创建
    if (syncManager) {
      syncManager.sync(data);
    }
  }, [syncManager, isOnline, currentToken]);

  /**
   * 立即同步
   */
  const syncNow = useCallback(async (data: NavData) => {
    if (!isOnline) {
      throw new Error("当前离线，无法同步");
    }

    if (!currentToken) {
      throw new Error("未认证用户");
    }

    // 优先使用当前同步管理器执行立即同步，确保本地最新数据写入远端
    if (syncManager) {
      await syncManager.syncNow(data);
      setLastSync(new Date());
      return;
    }

    // 回退到手动同步
    await manualSyncFn(currentToken);
    setLastSync(new Date());
  }, [isOnline, currentToken, syncManager]);

  /**
   * 手动同步 - 双向同步
   * 返回同步结果用于 UI 反馈
   */
  const handleManualSync = useCallback(async (): Promise<SyncResult> => {
    if (!isOnline) {
      throw new Error("当前离线，无法同步");
    }

    // 每次执行时都重新获取最新的 token
    if (!currentToken) {
      throw new Error("未认证用户");
    }

    const result = await manualSyncFn(currentToken);
    setLastSync(new Date());
    return result;
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
      // 每次刷新时都重新获取最新的 token
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
    syncStep,
    sync,
    syncNow,
    manualSync: handleManualSync,
    refresh,
    setToken,
  };
}
