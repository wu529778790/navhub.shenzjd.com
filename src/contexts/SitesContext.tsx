/**
 * Sites Context
 * 管理站点数据的 Context，集成本地存储和 GitHub 同步
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
import { useSync } from "@/hooks/use-sync";
import { useToast } from "@/components/ui/toast";
import {
  loadFromLocalStorage,
  saveSitesToLocalStorage,
  getSitesFromLocalStorage,
  type Category,
  type Site,
} from "@/lib/storage/local-storage";
import { getAuthState } from "@/lib/auth";
import { getDataFromGitHub, getYourDataFromGitHub } from "@/lib/storage/github-storage";
import type { SyncStepInfo } from "@/lib/storage/sync-manager";

interface AuthUser {
  id: string;
  name: string;
  avatar: string;
}

interface SitesContextType {
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
  syncStatus: string;
  syncStep: SyncStepInfo | null;
  isOnline: boolean;
  lastSync: Date | null;
  manualSync: () => Promise<{
    success: boolean;
    message?: string;
    direction: string;
    error?: string;
  }>;
  isGuestMode: boolean;
  authUser: AuthUser | null;
}

const SitesContext = createContext<SitesContextType | null>(null);

const defaultCategory: Category = {
  id: "default",
  name: "默认分类",
  sort: 0,
  sites: [],
};

export function SitesProvider({ children }: { children: ReactNode }) {
  const [sites, setSites] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [githubToken, setGithubToken] = useState<string | undefined>(undefined);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const { showToast } = useToast();

  const {
    status: syncStatus,
    syncStep,
    isOnline,
    lastSync,
    sync,
    syncNow,
    manualSync: runManualSync,
  } = useSync(githubToken);

  // 包装 manualSync 以在同步后刷新数据
  const manualSync = useCallback(async () => {
    if (isGuestMode) {
      return {
        success: false,
        direction: "none",
        error: "访客模式，无法同步（请登录后操作）",
      };
    }

    const result = await runManualSync();

    // 同步后刷新数据（无论是上传还是下载）
    if (result.success) {
      const data = loadFromLocalStorage();
      if (data?.categories) {
        setSites(data.categories);
      }
    }

    return result;
  }, [runManualSync, isGuestMode]);

  // 用于竞态控制：只允许最新的 fetch 更新状态
  const fetchIdRef = useRef(0);

  /**
   * 初始化：从本地或 GitHub 加载数据
   * 优化策略：
   * 1. 本地数据优先展示（消除 loading 转圈）
   * 2. 不带 forceRefresh 调用 getAuthState（利用缓存，不发网络请求）
   * 3. 认证检查与远程数据获取并行执行
   * 4. fetchId 防止旧请求覆盖新数据
   */
  const fetchSites = useCallback(async (_forceRefresh = false) => {
    const currentFetchId = ++fetchIdRef.current;
    try {
      setError(null);

      // 第一步：立即检查本地数据，有就先展示，消除 loading 转圈
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

      // 第二步：并行获取认证状态和远程数据（不阻塞 UI）
      const [auth, remoteResult] = await Promise.allSettled([
        getAuthState(), // 不带 forceRefresh，命中模块级缓存
        _forceRefresh
          ? getAuthState().then((a) => (a.token ? getDataFromGitHub(a.token) : null))
          : Promise.resolve(null),
      ]);

      // 如果已有更新的 fetch 在运行，放弃本次结果
      if (currentFetchId !== fetchIdRef.current) return;

      // 处理认证结果
      const authState = auth.status === "fulfilled" ? auth.value : { token: null, user: null };
      const currentToken = authState.token;

      if (currentToken) {
        setGithubToken(currentToken);
        setIsGuestMode(false);
        setAuthUser(authState.user);
      } else {
        setGithubToken(undefined);
        setIsGuestMode(true);
        setAuthUser(null);
      }

      // 处理远程数据（如果有 forceRefresh 结果）
      if (
        remoteResult.status === "fulfilled" &&
        remoteResult.value?.categories &&
        remoteResult.value.categories.length > 0
      ) {
        saveSitesToLocalStorage(remoteResult.value.categories);
        setSites(remoteResult.value.categories);
        setLoading(false);
        return;
      }

      // 第三步：如果本地没有有效数据，根据模式拉取
      const hasValidLocal =
        localData?.categories &&
        localData.categories.length > 0 &&
        !(
          localData.categories.length === 1 &&
          localData.categories[0].id === "default" &&
          localData.categories[0].sites.length === 0 &&
          localData.lastModified === 0
        );

      if (!hasValidLocal) {
        if (!currentToken) {
          // 访客模式：从 GitHub 拉取示例数据
          try {
            const yourData = await getYourDataFromGitHub();
            // 再次检查竞态
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
        } else {
          // 已登录但本地无数据：从 GitHub 拉取
          try {
            const githubData = await getDataFromGitHub(currentToken);
            // 再次检查竞态
            if (currentFetchId !== fetchIdRef.current) return;
            if (githubData?.categories && githubData.categories.length > 0) {
              saveSitesToLocalStorage(githubData.categories);
              setSites(githubData.categories);
              setLoading(false);
              return;
            }
          } catch (githubError) {
            console.error("从 GitHub 加载失败:", githubError);
          }
        }
      }

      // 最后：只有当 sites 为空时才设置默认分类（避免覆盖已加载的有效数据）
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
      // 尝试从本地加载作为 fallback
      const localData = getSitesFromLocalStorage();
      if (localData.length > 0) {
        setSites(localData);
      } else {
        setSites([defaultCategory]);
        saveSitesToLocalStorage([defaultCategory]);
      }
      setLoading(false);
    }
  }, []);

  // 组件挂载时加载数据
  useEffect(() => {
    void fetchSites();
  }, [fetchSites]);

  // 监听认证状态变化，自动刷新数据
  useEffect(() => {
    const handleAuthUpdate = () => {
      fetchSites(true);
    };

    window.addEventListener("auth-update", handleAuthUpdate);
    return () => window.removeEventListener("auth-update", handleAuthUpdate);
  }, [fetchSites]);

  // Helper: sync to GitHub after local update
  const syncToGitHub = useCallback(
    async (immediateSync = false) => {
      if (!githubToken || isGuestMode) return;
      const navData = loadFromLocalStorage();
      if (!navData) return;

      if (immediateSync) {
        try {
          await syncNow(navData);
        } catch (error) {
          console.error("同步失败:", error);
          const msg = error instanceof Error ? error.message : "同步失败";
          showToast(msg, "error");
          sync(navData);
        }
      } else {
        sync(navData);
      }
    },
    [githubToken, sync, syncNow, isGuestMode, showToast]
  );

  const addSite = useCallback(async (categoryId: string, site: Site) => {
    if (isGuestMode) {
      setError("访客模式，无法添加站点（请登录后操作）");
      return;
    }

    const newSites = sites.map((category) =>
      category.id === categoryId ? { ...category, sites: [...category.sites, site] } : category
    );
    setSites(newSites);
    saveSitesToLocalStorage(newSites);
    await syncToGitHub(false);
  }, [isGuestMode, sites, syncToGitHub]);

  const updateSite = useCallback(async (categoryId: string, siteId: string, site: Site) => {
    if (isGuestMode) {
      setError("访客模式，无法编辑站点（请登录后操作）");
      return;
    }

    const newSites = sites.map((category) =>
      category.id === categoryId
        ? { ...category, sites: category.sites.map((s) => (s.id === siteId ? site : s)) }
        : category
    );
    setSites(newSites);
    saveSitesToLocalStorage(newSites);
    await syncToGitHub(true);
  }, [isGuestMode, sites, syncToGitHub]);

  const deleteSite = useCallback(async (categoryId: string, siteId: string) => {
    if (isGuestMode) {
      setError("访客模式，无法删除站点（请登录后操作）");
      return;
    }

    const newSites = sites.map((category) =>
      category.id === categoryId
        ? { ...category, sites: category.sites.filter((s) => s.id !== siteId) }
        : category
    );
    setSites(newSites);
    saveSitesToLocalStorage(newSites);
    await syncToGitHub(true);
  }, [isGuestMode, sites, syncToGitHub]);

  const addCategory = useCallback(async (category: Category) => {
    if (isGuestMode) {
      setError("访客模式，无法添加分类（请登录后操作）");
      return;
    }

    const newSites = [...sites, category];
    setSites(newSites);
    saveSitesToLocalStorage(newSites);
    await syncToGitHub(false);
  }, [isGuestMode, sites, syncToGitHub]);

  const updateCategory = useCallback(async (categoryId: string, category: Category) => {
    if (isGuestMode) {
      setError("访客模式，无法编辑分类（请登录后操作）");
      return;
    }

    const newSites = sites.map((c: Category) => (c.id === categoryId ? category : c));
    setSites(newSites);
    saveSitesToLocalStorage(newSites);
    await syncToGitHub(true);
  }, [isGuestMode, sites, syncToGitHub]);

  const deleteCategory = useCallback(async (categoryId: string) => {
    if (isGuestMode) {
      setError("访客模式，无法删除分类（请登录后操作）");
      return;
    }

    const newSites = sites.filter((c: Category) => c.id !== categoryId);
    setSites(newSites);
    saveSitesToLocalStorage(newSites);
    await syncToGitHub(true);
  }, [isGuestMode, sites, syncToGitHub]);

  const updateSites = useCallback(async (newSites: Category[]) => {
    if (isGuestMode) {
      setError("访客模式，无法修改数据（请登录后操作）");
      return;
    }

    setSites(newSites);
    saveSitesToLocalStorage(newSites);
    await syncToGitHub(true);
  }, [isGuestMode, syncToGitHub]);

  const clearError = useCallback(() => setError(null), []);

  const contextValue = useMemo(
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
      syncStatus,
      syncStep,
      isOnline,
      lastSync,
      manualSync,
      isGuestMode,
      authUser,
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
      syncStatus,
      syncStep,
      isOnline,
      lastSync,
      manualSync,
      isGuestMode,
      authUser,
    ]
  );

  return (
    <SitesContext.Provider value={contextValue}>{children}</SitesContext.Provider>
  );
}

export function useSites() {
  const context = useContext(SitesContext);
  if (!context) {
    throw new Error("useSites must be used within a SitesProvider");
  }
  return context;
}
