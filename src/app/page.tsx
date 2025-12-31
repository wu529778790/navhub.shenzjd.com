/**\n * 主页 - 站点列表和管理\n */

"use client";

import { useState, useEffect } from "react";
import { useSites } from "@/contexts/SitesContext";
import { AddSiteCard } from "@/components/AddSiteCard";
import { SiteCard } from "@/components/SiteCard";
import { SyncStatus } from "@/components/SyncStatus";
import { Button } from "@/components/ui/button";
import { Plus, LogIn, LogOut, Github, ChevronDown } from "lucide-react";
import { getAuthState, clearAuth, setGitHubToken, setGitHubUser } from "@/lib/auth";

// GitHub OAuth 配置
const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "";

/**
 * 从 GitHub API 获取用户信息
 */
async function fetchGitHubUserInfo(token: string): Promise<{ id: string; name: string; avatar: string } | null> {
  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      id: data.id.toString(),
      name: data.name || data.login,
      avatar: data.avatar_url,
    };
  } catch (error) {
    console.error("Failed to fetch GitHub user info:", error);
    return null;
  }
}

export default function Home() {
  const {
    sites: categories,
    loading,
    error,
    refreshSites,
    isOnline,
    addCategory,
  } = useSites();
  const [session, setSession] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string>("default");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // 检查认证状态和处理 OAuth 回调
  useEffect(() => {
    // 检查 URL 参数（OAuth 回调传递的数据）
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userId = params.get("user_id");
    const userName = params.get("user_name");
    const userAvatar = params.get("user_avatar");
    const oauthError = params.get("oauth_error");

    if (oauthError) {
      alert(`登录失败: ${oauthError}`);
      // 清除错误参数
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (token && userId && userName && userAvatar) {
      // 从 OAuth 回调获取的数据，存储到 localStorage
      setGitHubToken(token);
      setGitHubUser({
        id: userId,
        name: userName,
        avatar: userAvatar,
      });
      setSession({
        user: { id: userId, name: userName, avatar: userAvatar },
        token: token,
      });
      // 清除 URL 参数
      window.history.replaceState({}, "", window.location.pathname);
      // 登录成功后，从 GitHub 拉取数据
      setTimeout(() => refreshSites(true), 100);
      return;
    }

    // 检查本地存储
    const auth = getAuthState();
    if (auth.token && auth.user) {
      setSession({ user: auth.user, token: auth.token });
    }
  }, []);

  // GitHub OAuth 登录
  const handleGitHubLogin = () => {
    if (!GITHUB_CLIENT_ID) {
      alert("请配置 NEXT_PUBLIC_GITHUB_CLIENT_ID 环境变量");
      return;
    }
    // 重定向到 GitHub OAuth
    // 使用你配置的回调 URL: http://localhost/api/auth/callback/github
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/callback/github`);
    const scope = encodeURIComponent("repo gist");
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}`;
  };

  // GitHub OAuth 登出
  const handleGitHubLogout = () => {
    clearAuth();
    setSession(null);
    window.location.reload();
  };

  // 处理添加分类
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      alert("请输入分类名称");
      return;
    }

    addCategory({
      id: `cat_${Date.now()}`,
      name: newCategoryName.trim(),
      icon: "📁",
      sort: categories.length,
      sites: [],
    });

    setNewCategoryName("");
    setShowAddCategoryModal(false);
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    if (!showUserMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.relative')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  // 获取当前分类
  const currentCategory = categories.find(c => c.id === activeCategory) || categories[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">个人导航</h1>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
              v1.0
            </span>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* 同步状态 */}
            <SyncStatus />

            {/* 认证按钮 */}
            {session ? (
              <div className="relative">
                {/* 头像按钮 */}
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <img
                    src={session.user.avatar}
                    alt={session.user.name}
                    className="w-7 h-7 rounded-full"
                  />
                  <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* 下拉菜单 */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="font-medium text-gray-900 text-sm">
                        {session.user.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        已登录
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        handleGitHubLogout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                size="sm"
                onClick={handleGitHubLogin}
                className="flex items-center gap-2"
              >
                <Github className="w-4 h-4" />
                GitHub 登录
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* 离线提示 */}
      {!isOnline && (
        <div className="bg-yellow-100 border-b border-yellow-200 text-yellow-800 px-4 py-2 text-sm text-center">
          ⚠️ 当前处于离线状态，数据将保存到本地，恢复网络后自动同步
        </div>
      )}

      {/* 主内容区 */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* 分类导航 */}
        {categories.length > 0 && (
          <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(category.id)}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                {category.name}
              </Button>
            ))}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAddCategoryModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              添加分类
            </Button>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* 站点列表 */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="w-full aspect-square bg-gray-200 rounded-xl mb-2" />
                <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-400 mb-4">暂无站点</div>
            <Button
              onClick={() => setShowAddCategoryModal(true)}
              className="flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              创建第一个分类
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* 现有站点 */}
            {currentCategory?.sites.map((site) => (
              <SiteCard
                key={site.id}
                id={site.id}
                title={site.title}
                url={site.url}
                favicon={site.favicon}
                categoryId={currentCategory.id}
                onSiteChange={refreshSites}
              />
            ))}

            {/* 添加站点卡片 */}
            {currentCategory && (
              <AddSiteCard
                activeCategory={currentCategory.id}
                onSuccess={refreshSites}
              />
            )}
          </div>
        )}

      </main>

      {/* 添加分类模态框 */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">添加分类</h3>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="输入分类名称"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCategory();
                if (e.key === "Escape") setShowAddCategoryModal(false);
              }}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowAddCategoryModal(false)}
              >
                取消
              </Button>
              <Button onClick={handleAddCategory}>确认</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
