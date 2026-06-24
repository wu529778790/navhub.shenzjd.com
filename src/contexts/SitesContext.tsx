/**
 * Sites Context (组合层)
 * 组合 AuthContext + DataContext + SyncContext
 * 保持向后兼容：useSites() 仍然可用
 *
 * 新代码建议直接使用:
 * - useAuth()   → 认证状态（isGuestMode, authUser）
 * - useData()   → 数据 CRUD（sites, addSite, ...）
 * - useSyncState() → 同步状态（syncStatus, manualSync, ...）
 */

"use client";

import { ReactNode } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import { DataProvider } from "./DataContext";

/** 同步状态 Hook 类型（由外部 Sync Provider 提供） */
export interface SyncStateHook {
  syncStatus: string;
  syncStep: import("@/types").SyncStepInfo | null;
  isOnline: boolean;
  lastSync: Date | null;
  manualSync: () => Promise<{
    success: boolean;
    message?: string;
    direction: string;
    error?: string;
  }>;
}

/** 兼容的 ManualSyncResult 类型（包含 message） */
export interface ManualSyncResult {
  success: boolean;
  message?: string;
  direction: string;
  error?: string;
}

interface SitesProviderProps {
  children: ReactNode;
  /** 同步状态 hook 实例（可选，用于组合） */
  syncState?: SyncStateHook;
}

/**
 * SitesProvider - 组合三个独立的 Context
 */
export function SitesProvider({ children }: SitesProviderProps) {
  const { isAuthenticated, isGuestMode, authUser } = useAuth();

  return (
    <DataProvider
      isAuthenticated={isAuthenticated}
      isGuestMode={isGuestMode}
      authUser={authUser}
      onSyncRequest={() => {
        // 触发同步的逻辑由调用者决定，此处仅作为桥接
      }}
    >
      {children}
    </DataProvider>
  );
}

// 导出组合 Provider（包含 AuthProvider）
export function AppProviders({ children }: SitesProviderProps) {
  return (
    <AuthProvider>
      <SitesProvider>{children}</SitesProvider>
    </AuthProvider>
  );
}

// Re-export 子 hooks 以保持向后兼容
export { useAuth } from "./AuthContext";
export { useData } from "./DataContext";

// 内部导入（用于 createUseSites）
import { useData as _useData } from "./DataContext";

// 兼容旧代码的统一 Hook（从各子 Context 聚合）
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- 保留供未来扩展使用
function createUseSites(syncState: SyncStateHook) {
  return function useSites() {
    const auth = useAuth();
    const data = _useData();

    // 合并返回，保持原有接口不变
    return {
      // 来自 DataContext
      ...data,
      // 来自 AuthContext
      isGuestMode: auth.isGuestMode,
      authUser: auth.authUser,
      // 来自 Sync State
      ...syncState,
    };
  };
}

// 注意: 由于 React Hooks 不能条件调用，
// 实际使用时需要通过其他方式注入 syncState
// 这里保留接口定义供参考

/**
 * @deprecated 建议使用 useAuth() + useData() 替代
 * 如需完整功能，请使用 AppProviders 包裹并分别调用子 hooks
 */
export function useSites() {
  console.warn(
    "useSites() is deprecated. Please use useAuth() + useData() separately for better performance."
  );

  // 尝试获取上下文（可能不完整）
  const auth = useAuth();
  const data = _useData();

  return {
    ...data,
    isGuestMode: auth.isGuestMode,
    authUser: auth.authUser,
    // 同步相关字段需要在更上层提供
    syncStatus: "",
    syncStep: null,
    isOnline: true,
    lastSync: null,
    manualSync: async (): Promise<ManualSyncResult> => ({ success: false, direction: "none", error: "Not configured" }),
  };
}
