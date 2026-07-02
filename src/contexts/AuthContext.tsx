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
  useRef,
  ReactNode,
} from "react";
import { getAuthState } from "@/lib/auth";
import { clearAllNavLocalStorage } from "@/lib/storage/local-storage";
import { useCookies } from "@/hooks/use-cookies";
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

/**
 * onUserChanged: 当用户身份发生翻转（登录 → 登出、登出 → 登录、A用户 → B用户）
 * 时被调用，以便外部（SyncProvider / DataContext）做清理。
 */
export interface AuthEventCallbacks {
  onUserChanged?: (info: {
    previousId: string | null;
    currentId: string | null;
  }) => void;
}

export function AuthProvider({
  children,
  onUserChanged,
}: {
  children: ReactNode;
} & AuthEventCallbacks) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const { setCookie, deleteCookie } = useCookies();

  // 用来检测 authUser 的「跨渲染」身份变化。
  // 通过 ref 而不是 state 是因为我们只想在变化时触发一次副作用，
  // 而不想让 prevAuthUser 自身驱动重渲染。
  const prevAuthIdRef = useRef<string | null>(null);

  /**
   * 刷新认证状态 — 供外部调用(如 auth-update 事件回调、手动刷新)
   * @param forceRefresh 是否强制刷新缓存
   */
  const refreshAuth = useCallback(
    async (forceRefresh = false) => {
      try {
        const authState = await getAuthState(forceRefresh);
        if (authState.token) {
          setIsAuthenticated(true);
          setIsGuestMode(false);
          setAuthUser(authState.user);
          // 写一份 JS 可读（非 HttpOnly）的登录标记，供客户端做用户切换检测
          // 值来自 /api/auth/session 的 user.id（GitHub 数字 ID，唯一）
          if (authState.user?.id) {
            setCookie("nav_auth_id", authState.user.id);
          }
        } else {
          setIsAuthenticated(false);
          setIsGuestMode(true);
          setAuthUser(null);
          deleteCookie("nav_auth_id");
        }
      } catch (error) {
        console.error("获取认证状态失败:", error);
        setIsAuthenticated(false);
        setIsGuestMode(true);
        setAuthUser(null);
        deleteCookie("nav_auth_id");
      }
    },
    [setCookie, deleteCookie]
  );

  // 检测用户身份变化（login / logout / 切换账号）时调用 onUserChanged
  useEffect(() => {
    const currentId = authUser?.id ?? null;
    const previousId = prevAuthIdRef.current;
    // 只在真正发生变化时回调（避免首次加载触发）
    if (previousId !== currentId && (previousId !== null || currentId !== null)) {
      onUserChanged?.({ previousId, currentId });
      // 用户变化时清空前用户的 localStorage（安全隔离）
      // 这个清理也在 effect 里调用，确保外部组件有机会先通过 onUserChanged 感知
      if (previousId !== null && currentId !== null && previousId !== currentId) {
        clearAllNavLocalStorage();
      }
    }
    prevAuthIdRef.current = currentId;
  }, [authUser?.id, onUserChanged]);

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
