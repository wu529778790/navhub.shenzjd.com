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
import { getDataFromGitHub, getYourDataFromGitHub } from "@/lib/storage/github-storage";

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
  isOnline: boolean;
  lastSync: Date | null;
  manualSync: () => Promise<{ success: boolean; message?: string; direction: string; error?: string }>;
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
  useEffect(() => {
    const auth = getAuthState();
    if (auth.token) {
      setGithubToken(auth.token);
      setIsGuestMode(false);
    } else {
      // 未登录，使用访客模式（只读你的数据，无需 token）
      setIsGuestMode(true);
    }
  }, []);

  const { status: syncStatus, isOnline, lastSync, sync, manualSync: useSyncManualSync, refresh } = useSync(githubToken);

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

    const result = await useSyncManualSync();

    // 同步后刷新数据（无论是上传还是下载）
    if (result.success) {
      const data = loadFromLocalStorage();
      if (data?.categories) {
        setSites(data.categories);
      }
    }

    return result;
  }, [useSyncManualSync, isGuestMode]);

  // 初始化：从本地或 GitHub 加载数据
  const fetchSites = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // 每次都重新检查认证状态
      const auth = getAuthState();
      const currentToken = auth.token;

      if (currentToken) {
        // 已登录
        setGithubToken(currentToken);
        setIsGuestMode(false);
      } else {
        // 未登录，使用访客模式
        setIsGuestMode(true);
      }

      // forceRefresh=true 表示需要强制从 GitHub 拉取（登录后场景）
      if (forceRefresh) {
        if (currentToken) {
          // 已登录：从用户自己的 GitHub 仓库拉取
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
        } else {
          // 未登录：从你的仓库拉取示例数据
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
        }
      }

      // 普通加载：检查本地数据是否有效（有真实数据且未过期）
      const localData = loadFromLocalStorage();

      // 如果本地有数据（loadFromLocalStorage 返回非 null，说明未过期且有数据），直接使用
      if (localData?.categories && localData.categories.length > 0) {
        // 额外检查：如果是空的默认分类且时间戳为 0，仍然需要拉取
        const isDefaultEmpty = localData.categories.length === 1 &&
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
      if (currentToken) {
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

      // 访客模式：从你的仓库拉取
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
      }

      // 最后：创建默认分类（如果所有拉取都失败）
      const defaultCategory: Category = {
        id: "default",
        name: "默认分类",
        icon: "📁",
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
          icon: "📁",
          sort: 0,
          sites: [],
        };
        setSites([defaultCategory]);
        saveSitesToLocalStorage([defaultCategory]);
      }
      setLoading(false);
    }
  }, [refresh]);

  // 组件挂载时加载数据
  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  // 操作函数：立即更新本地 + 后台同步
  const updateSitesData = useCallback((newSites: Category[]) => {
    // 访客模式不允许修改
    if (isGuestMode) {
      setError("访客模式，无法修改数据（请登录后操作）");
      return;
    }

    setSites(newSites);
    saveSitesToLocalStorage(newSites);

    // 后台同步到 GitHub（如果已登录）
    if (githubToken && !isGuestMode) {
      const navData = loadFromLocalStorage();
      if (navData) {
        sync(navData);
      }
    }
  }, [githubToken, sync, isGuestMode]);

  const addSite = async (categoryId: string, site: Site) => {
    if (isGuestMode) {
      setError("访客模式，无法添加站点（请登录后操作）");
      return;
    }

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
    if (isGuestMode) {
      setError("访客模式，无法编辑站点（请登录后操作）");
      return;
    }

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
    if (isGuestMode) {
      setError("访客模式，无法删除站点（请登录后操作）");
      return;
    }

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
    if (isGuestMode) {
      setError("访客模式，无法添加分类（请登录后操作）");
      return;
    }

    const newSites = [...sites, category];
    updateSitesData(newSites);
  };

  const updateCategory = async (categoryId: string, category: Category) => {
    if (isGuestMode) {
      setError("访客模式，无法编辑分类（请登录后操作）");
      return;
    }

    const newSites = sites.map((c) => (c.id === categoryId ? category : c));
    updateSitesData(newSites);
  };

  const deleteCategory = async (categoryId: string) => {
    if (isGuestMode) {
      setError("访客模式，无法删除分类（请登录后操作）");
      return;
    }

    const newSites = sites.filter((c) => c.id !== categoryId);
    updateSitesData(newSites);
  };

  const updateSites = async (newSites: Category[]) => {
    if (isGuestMode) {
      setError("访客模式，无法修改数据（请登录后操作）");
      return;
    }

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
        isGuestMode,
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
