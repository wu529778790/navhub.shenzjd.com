/**
 * 数据状态 Context
 * 管理站点/分类的 CRUD 操作
 * 与认证和同步解耦，减少不必要的重渲染
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
import {
  loadFromLocalStorage,
  saveSitesToLocalStorage,
  getSitesFromLocalStorage,
} from "@/lib/storage/local-storage";
import { getDataFromGitHub, getYourDataFromGitHub } from "@/lib/storage/github-storage";
import type { Category, Site, AuthUser } from "@/types";

interface DataContextType {
  sites: Category[];
  loading: boolean;
  error: string | null;
  clearError: () => void;
  addSite: (categoryId: string, site: Site) => Promise<void>;
  updateSite: (categoryId: string, siteId: string, site: Site) => Promise<void>;
  deleteSite: (categoryId: string, siteId: string) => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (categoryId: string, category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  refreshSites: (forceRefresh?: boolean) => Promise<void>;
  updateSites: (sites: Category[]) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

const defaultCategory: Category = {
  id: "default",
  name: "默认分类",
  sort: 0,
  sites: [],
};

export function DataProvider({
  children,
  isAuthenticated,
  isGuestMode,
  authUser,
  onSyncRequest,
}: {
  children: ReactNode;
  /** 是否已认证 */
  isAuthenticated: boolean;
  /** 是否为访客模式 */
  isGuestMode: boolean;
  /** 用户信息（可选） */
  authUser: AuthUser | null;
  /** 数据变更后请求同步的回调 */
  onSyncRequest?: (immediateSync: boolean) => void;
}) {
  const [sites, setSites] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 用于竞态控制：只允许最新的 fetch 更新状态
  const fetchIdRef = useRef(0);

  /**
   * 初始化：从本地或 GitHub 加载数据
   */
  const fetchSites = useCallback(
    async (_forceRefresh = false) => {
      const currentFetchId = ++fetchIdRef.current;
      try {
        setError(null);

        // 第一步：立即检查本地数据
        const localData = loadFromLocalStorage();
        if (localData?.categories && localData.categories.length > 0) {
          const isDefault =
            localData.categories.length === 1 &&
            localData.categories[0].id === "default" &&
            localData.categories[0].sites.length === 0 &&
            localData.lastModified === 0;

          if (!isDefault) {
            setSites(localData.categories);
            setLoading(false);
          }
        }

        // 第二步：根据认证状态获取远程数据
        if (_forceRefresh && isAuthenticated) {
          const githubData = await getDataFromGitHub(authUser ? "token-from-context" : "");
          if (currentFetchId !== fetchIdRef.current) return;

          if (githubData?.categories && githubData.categories.length > 0) {
            saveSitesToLocalStorage(githubData.categories);
            setSites(githubData.categories);
            setLoading(false);
            return;
          }
        }

        // 第三步：如果本地没有有效数据
        if (!localData?.categories || localData.categories.length === 0) {
          if (!isAuthenticated || isGuestMode) {
            // 访客模式：从 GitHub 拉取示例数据
            try {
              const yourData = await getYourDataFromGitHub();
              if (currentFetchId !== fetchIdRef.current) return;
              if (yourData?.categories && yourData.categories.length > 0) {
                saveSitesToLocalStorage(yourData.categories);
                setSites(yourData.categories);
                setLoading(false);
                return;
              }
            } catch (guestError) {
              console.error("读取示例数据失败:", guestError);
              if (
                guestError instanceof Error &&
                guestError.message.includes("运行时配置加载失败")
              ) {
                throw guestError;
              }
            }
          }
        }

        // 最后：设置默认分类
        if (currentFetchId !== fetchIdRef.current) return;
        setSites((prev) => {
          if (prev.length === 0) {
            saveSitesToLocalStorage([defaultCategory]);
            return [defaultCategory];
          }
          return prev;
        });
        setLoading(false);
      } catch (err) {
        if (currentFetchId !== fetchIdRef.current) return;
        setError(err instanceof Error ? err.message : "加载失败");
        const fallbackLocal = getSitesFromLocalStorage();
        if (fallbackLocal.length > 0) {
          setSites(fallbackLocal);
        } else {
          setSites([defaultCategory]);
          saveSitesToLocalStorage([defaultCategory]);
        }
        setLoading(false);
      }
    },
    [isAuthenticated, isGuestMode, authUser]
  );

  // 组件挂载时加载数据
  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  // 监听认证变化自动刷新
  useEffect(() => {
    const handleAuthUpdate = () => fetchSites(true);
    window.addEventListener("auth-update", handleAuthUpdate);
    return () => window.removeEventListener("auth-update", handleAuthUpdate);
  }, [fetchSites]);

  // CRUD 操作 - 使用函数式更新避免竞态条件

  const addSite = useCallback(
    async (categoryId: string, site: Site) => {
      if (isGuestMode) {
        window.location.href = "/api/auth/github/login";
        return;
      }

      setSites((prevSites) => {
        const newSites = prevSites.map((category) =>
          category.id === categoryId
            ? { ...category, sites: [...category.sites, site] }
            : category
        );
        saveSitesToLocalStorage(newSites);
        return newSites;
      });
      onSyncRequest?.(false);
    },
    [isGuestMode, onSyncRequest]
  );

  const updateSite = useCallback(
    async (categoryId: string, siteId: string, site: Site) => {
      if (isGuestMode) {
        window.location.href = "/api/auth/github/login";
        return;
      }

      setSites((prevSites) => {
        const newSites = prevSites.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                sites: category.sites.map((s) => (s.id === siteId ? site : s)),
              }
            : category
        );
        saveSitesToLocalStorage(newSites);
        return newSites;
      });
      onSyncRequest?.(true);
    },
    [isGuestMode, onSyncRequest]
  );

  const deleteSite = useCallback(
    async (categoryId: string, siteId: string) => {
      if (isGuestMode) {
        window.location.href = "/api/auth/github/login";
        return;
      }

      setSites((prevSites) => {
        const newSites = prevSites.map((category) =>
          category.id === categoryId
            ? { ...category, sites: category.sites.filter((s) => s.id !== siteId) }
            : category
        );
        saveSitesToLocalStorage(newSites);
        return newSites;
      });
      onSyncRequest?.(true);
    },
    [isGuestMode, onSyncRequest]
  );

  const addCategory = useCallback(
    async (category: Category) => {
      if (isGuestMode) {
        window.location.href = "/api/auth/github/login";
        return;
      }

      setSites((prevSites) => {
        const newSites = [...prevSites, category];
        saveSitesToLocalStorage(newSites);
        return newSites;
      });
      onSyncRequest?.(false);
    },
    [isGuestMode, onSyncRequest]
  );

  const updateCategory = useCallback(
    async (categoryId: string, category: Category) => {
      if (isGuestMode) {
        window.location.href = "/api/auth/github/login";
        return;
      }

      setSites((prevSites) => {
        const newSites = prevSites.map((c) => (c.id === categoryId ? category : c));
        saveSitesToLocalStorage(newSites);
        return newSites;
      });
      onSyncRequest?.(true);
    },
    [isGuestMode, onSyncRequest]
  );

  const deleteCategory = useCallback(
    async (categoryId: string) => {
      if (isGuestMode) {
        window.location.href = "/api/auth/github/login";
        return;
      }

      setSites((prevSites) => {
        const newSites = prevSites.filter((c) => c.id !== categoryId);
        saveSitesToLocalStorage(newSites);
        return newSites;
      });
      onSyncRequest?.(true);
    },
    [isGuestMode, onSyncRequest]
  );

  const updateSites = useCallback(
    async (newSites: Category[]) => {
      if (isGuestMode) {
        window.location.href = "/api/auth/github/login";
        return;
      }

      setSites(newSites);
      saveSitesToLocalStorage(newSites);
      onSyncRequest?.(true);
    },
    [isGuestMode, onSyncRequest]
  );

  const clearError = useCallback(() => setError(null), []);

  const contextValue = useMemo<DataContextType>(
    () => ({
      sites,
      loading,
      error,
      clearError,
      addSite,
      updateSite,
      deleteSite,
      addCategory,
      updateCategory,
      deleteCategory,
      refreshSites: fetchSites,
      updateSites,
    }),
    [
      sites,
      loading,
      error,
      clearError,
      addSite,
      updateSite,
      deleteSite,
      addCategory,
      updateCategory,
      deleteCategory,
      fetchSites,
      updateSites,
    ]
  );

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
