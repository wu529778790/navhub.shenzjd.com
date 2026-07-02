"use client";

/**
 * NavLogoutCleanup — 监听登出行为并清理本地缓存
 *
 * 修复：登出后 localStorage 残留导致下次登录读到旧数据的 bug。
 *
 * 挂载位置：AuthProvider → SitesProvider → NavLogoutCleanup
 * 这样 AuthContext 能提供 isAuthenticated 信号；DataContext 已初始化。
 *
 * 清理项：
 * - localStorage nav_* 前缀数据
 * - 全局 SyncManager 实例（下一次 login 时重建）
 */

import { useEffect, useRef } from "react";
import { releaseSyncManager } from "@/lib/storage/nav-sync";
import { clearAllNavLocalStorage } from "@/lib/storage/local-storage";
import { useAuth } from "@/contexts/AuthContext";

export function NavLogoutCleanup() {
  const { isAuthenticated } = useAuth();
  const prevAuthRef = useRef<boolean | null>(null);

  useEffect(() => {
    const prevAuth = prevAuthRef.current;
    // 从未登录 → 登出（或 token 过期）
    if (prevAuth === true && !isAuthenticated) {
      releaseSyncManager();
      clearAllNavLocalStorage();
    }
    // 从登录 → 也由 AuthContext 的 onUserChanged 处理，这里不重复清理避免竞态
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);

  return null;
}
