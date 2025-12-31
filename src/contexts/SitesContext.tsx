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
  ReactNode,
} from "react";
import { useSync } from "@/hooks/use-sync";
import {
  loadFromLocalStorage,
  saveSitesToLocalStorage,
  getSitesFromLocalStorage,
  type Category,
  type Site,
} from "@/lib/storage/local-storage";
import { getAuthState } from "@/lib/auth";

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
  refreshSites: () => Promise<void>;
  updateSites: (sites: Category[]) => Promise<void>;
  syncStatus: string;
  isOnline: boolean;
  lastSync: Date | null;
  manualSync: () => Promise<void>;
}

const SitesContext = createContext<SitesContextType | null>(null);

export function SitesProvider({ children }: { children: ReactNode }) {
  const [sites, setSites] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [githubToken, setGithubToken] = useState<string | undefined>(undefined);

  // 获取 GitHub token（如果已登录）
  useEffect(() => {
    const auth = getAuthState();
    if (auth.token) {
      setGithubToken(auth.token);
    }
  }, []);

  const { status: syncStatus, isOnline, lastSync, sync, manualSync, refresh } = useSync(githubToken);

  // 初始化：从本地或 GitHub 加载数据
  const fetchSites = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      if (!forceRefresh) {
        // 优先从本地加载
        const localData = loadFromLocalStorage();
        if (localData?.categories) {
          setSites(localData.categories);
          setLoading(false);
          return;
        }
      }

      // 如果需要刷新或本地没有数据，从 GitHub 获取
      const data = await refresh();
      if (data?.categories) {
        setSites(data.categories);
      } else {
        setSites([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
      // 尝试从本地加载作为 fallback
      const localData = getSitesFromLocalStorage();
      if (localData.length > 0) {
        setSites(localData);
      }
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  // 操作函数：立即更新本地 + 后台同步
  const updateSitesData = useCallback((newSites: Category[]) => {
    setSites(newSites);
    saveSitesToLocalStorage(newSites);

    // 后台同步到 GitHub（如果已登录）
    if (githubToken) {
      const navData = loadFromLocalStorage();
      if (navData) {
        sync(navData);
      }
    }
  }, [githubToken, sync]);

  const addSite = async (categoryId: string, site: Site) => {
    const newSites = sites.map((category) => {
      if (category.id === categoryId) {
        return {
          ...category,
          sites: [...category.sites, site],
        };
      }
      return category;
    });

    updateSitesData(newSites);
  };

  const updateSite = async (categoryId: string, siteId: string, site: Site) => {
    const newSites = sites.map((category) => {
      if (category.id === categoryId) {
        return {
          ...category,
          sites: category.sites.map((s) => (s.id === siteId ? site : s)),
        };
      }
      return category;
    });

    updateSitesData(newSites);
  };

  const deleteSite = async (categoryId: string, siteId: string) => {
    const newSites = sites.map((category) => {
      if (category.id === categoryId) {
        return {
          ...category,
          sites: category.sites.filter((s) => s.id !== siteId),
        };
      }
      return category;
    });

    updateSitesData(newSites);
  };

  const addCategory = async (category: Category) => {
    const newSites = [...sites, category];
    updateSitesData(newSites);
  };

  const updateCategory = async (categoryId: string, category: Category) => {
    const newSites = sites.map((c) => (c.id === categoryId ? category : c));
    updateSitesData(newSites);
  };

  const deleteCategory = async (categoryId: string) => {
    const newSites = sites.filter((c) => c.id !== categoryId);
    updateSitesData(newSites);
  };

  const updateSites = async (newSites: Category[]) => {
    updateSitesData(newSites);
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
        isOnline,
        lastSync,
        manualSync,
      }}>
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
