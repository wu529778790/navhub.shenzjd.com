/**
 * Sites Context
 * 管理站点数据的 Context，集成本地存储和 GitHub 同步
 */

"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useSync } from "@/hooks/use-sync";
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

interface SitesContextType {
  sites: Category[];
  loading: boolean;
  error: string | null;
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
}

const SitesContext = createContext<SitesContextType | null>(null);

export function SitesProvider({ children }: { children: ReactNode }) {
  const [sites, setSites] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [githubToken, setGithubToken] = useState<string | undefined>(undefined);
  const [isGuestMode, setIsGuestMode] = useState(false);

  // 获取 GitHub token（如果已登录）
  // 这个 effect 会在组件挂载时运行，并且监听 storage 变化以响应登录状态更新
  useEffect(() => {
    const checkAuth = () => {
      void (async () => {
        const auth = await getAuthState(true);
        if (auth.token) {
          setGithubToken(auth.token);
          setIsGuestMode(false);
        } else {
          // 未登录，使用访客模式（只读你的数据，无需 token）
          setGithubToken(undefined);
          setIsGuestMode(true);
        }
      })();
    };

    // 初始检查
    checkAuth();

    // 监听 storage 变化（用于响应登录/登出）
    // 监听自定义事件（用于登录后的页面刷新）
    const handleAuthUpdate = () => {
      checkAuth();
    };

    window.addEventListener("auth-update", handleAuthUpdate);

    return () => {
      window.removeEventListener("auth-update", handleAuthUpdate);
    };
  }, []);

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
    // 访客模式不允许同步
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

  // 初始化：从本地或 GitHub 加载数据
  const fetchSites = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // 每次都重新检查认证状态
      const auth = await getAuthState(true);
      const currentToken = auth.token;

      if (currentToken) {
        // 已登录
        setGithubToken(currentToken);
        setIsGuestMode(false);
      } else {
        // 未登录，使用访客模式
        setIsGuestMode(true);
      }

      // 访客模式：每次都直接从你的 GitHub 拉取最新数据，不使用本地缓存
      if (!currentToken) {
        try {
          const yourData = await getYourDataFromGitHub();
          if (yourData?.categories && yourData.categories.length > 0) {
            saveSitesToLocalStorage(yourData.categories);
            setSites(yourData.categories);
            setLoading(false);
            return;
          }
        } catch (guestError) {
          console.error("读取示例数据失败:", guestError);
        }
        // 如果 GitHub 拉取失败，继续执行后面的 fallback 逻辑
      }

      // 已登录模式：forceRefresh=true 表示需要强制从 GitHub 拉取
      if (forceRefresh && currentToken) {
        try {
          const githubData = await getDataFromGitHub(currentToken);
          if (githubData?.categories && githubData.categories.length > 0) {
            saveSitesToLocalStorage(githubData.categories);
            setSites(githubData.categories);
            setLoading(false);
            return;
          }
        } catch (githubError) {
          console.error("从 GitHub 拉取失败:", githubError);
        }
      }

      // 已登录模式：普通加载，检查本地数据是否有效
      if (currentToken) {
        const localData = loadFromLocalStorage();

        // 如果本地有有效数据（未过期且有真实内容），直接使用
        if (localData?.categories && localData.categories.length > 0) {
          // 额外检查：如果是空的默认分类且时间戳为 0，仍然需要拉取
          const isDefaultEmpty =
            localData.categories.length === 1 &&
            localData.categories[0].id === "default" &&
            localData.categories[0].sites.length === 0 &&
            localData.lastModified === 0;

          if (!isDefaultEmpty) {
            setSites(localData.categories);
            setLoading(false);
            return;
          }
        }

        // 本地是初始化状态，尝试从 GitHub 拉取
        try {
          const githubData = await getDataFromGitHub(currentToken);
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

      // 最后：创建默认分类（如果所有拉取都失败）
      const defaultCategory: Category = {
        id: "default",
        name: "默认分类",
        sort: 0,
        sites: [],
      };
      setSites([defaultCategory]);
      saveSitesToLocalStorage([defaultCategory]);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
      // 尝试从本地加载作为 fallback
      const localData = getSitesFromLocalStorage();
      if (localData.length > 0) {
        setSites(localData);
      } else {
        const defaultCategory: Category = {
          id: "default",
          name: "默认分类",
          sort: 0,
          sites: [],
        };
        setSites([defaultCategory]);
        saveSitesToLocalStorage([defaultCategory]);
      }
      setLoading(false);
    }
  }, []);

  // 组件挂载时加载数据
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchSites();
  }, [fetchSites]);

  // 监听认证状态变化，自动刷新数据
  useEffect(() => {
    const handleAuthUpdate = () => {
      // 认证状态变化，强制刷新数据
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
          sync(navData);
        }
      } else {
        sync(navData);
      }
    },
    [githubToken, sync, syncNow, isGuestMode]
  );

  const addSite = async (categoryId: string, site: Site) => {
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
  };

  const updateSite = async (categoryId: string, siteId: string, site: Site) => {
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
  };

  const deleteSite = async (categoryId: string, siteId: string) => {
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
  };

  const addCategory = async (category: Category) => {
    if (isGuestMode) {
      setError("访客模式，无法添加分类（请登录后操作）");
      return;
    }

    const newSites = [...sites, category];
    setSites(newSites);
    saveSitesToLocalStorage(newSites);
    await syncToGitHub(false);
  };

  const updateCategory = async (categoryId: string, category: Category) => {
    if (isGuestMode) {
      setError("访客模式，无法编辑分类（请登录后操作）");
      return;
    }

    const newSites = sites.map((c: Category) => (c.id === categoryId ? category : c));
    setSites(newSites);
    saveSitesToLocalStorage(newSites);
    await syncToGitHub(true);
  };

  const deleteCategory = async (categoryId: string) => {
    if (isGuestMode) {
      setError("访客模式，无法删除分类（请登录后操作）");
      return;
    }

    const newSites = sites.filter((c: Category) => c.id !== categoryId);
    setSites(newSites);
    saveSitesToLocalStorage(newSites);
    await syncToGitHub(true);
  };

  const updateSites = async (newSites: Category[]) => {
    if (isGuestMode) {
      setError("访客模式，无法修改数据（请登录后操作）");
      return;
    }

    setSites(newSites);
    saveSitesToLocalStorage(newSites);
    await syncToGitHub(true);
  };

  return (
    <SitesContext.Provider
      value={{
        sites,
        loading,
        error,
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
      }}
    >
      {children}
    </SitesContext.Provider>
  );
}

export function useSites() {
  const context = useContext(SitesContext);
  if (!context) {
    throw new Error("useSites must be used within a SitesProvider");
  }
  return context;
}
