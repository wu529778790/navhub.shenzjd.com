/**
 * 认证状态 Context
 * 管理用户登录状态、访客模式、认证信息
 */

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { getAuthState } from "@/lib/auth";
import type { AuthUser } from "@/types";

interface AuthContextType {
  /** GitHub token（服务端通过 HttpOnly Cookie 设置，此处仅存标志） */
  isAuthenticated: boolean;
  /** 是否为访客模式 */
  isGuestMode: boolean;
  /** 已登录的用户信息 */
  authUser: AuthUser | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  /**
   * 刷新认证状态 — 供外部调用(如 auth-update 事件回调、手动刷新)
   * @param forceRefresh 是否强制刷新缓存
   */
  const refreshAuth = useCallback(async (forceRefresh = false) => {
    try {
      const authState = await getAuthState(forceRefresh);
      if (authState.token) {
        setIsAuthenticated(true);
        setIsGuestMode(false);
        setAuthUser(authState.user);
      } else {
        setIsAuthenticated(false);
        setIsGuestMode(true);
        setAuthUser(null);
      }
    } catch (error) {
      console.error("获取认证状态失败:", error);
      setIsAuthenticated(false);
      setIsGuestMode(true);
      setAuthUser(null);
    }
  }, []);

  // 组件挂载时初始化
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 组件挂载时必须从外部源获取初始认证状态
    refreshAuth();
  }, [refreshAuth]);

  // 监听认证变化事件
  useEffect(() => {
    const handleAuthUpdate = () => refreshAuth(true);
    window.addEventListener("auth-update", handleAuthUpdate);
    return () => window.removeEventListener("auth-update", handleAuthUpdate);
  }, [refreshAuth]);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      isAuthenticated,
      isGuestMode,
      authUser,
    }),
    [isAuthenticated, isGuestMode, authUser]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
