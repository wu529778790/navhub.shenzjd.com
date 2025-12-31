/**\n * 主页 - 站点列表和管理\n */

"use client";

import { useState, useEffect } from "react";
import { useSites } from "@/contexts/SitesContext";
import { AddSiteCard } from "@/components/AddSiteCard";
import { SiteCard } from "@/components/SiteCard";
import { SyncStatus } from "@/components/SyncStatus";
import { Button } from "@/components/ui/button";
import { Plus, LogIn, LogOut, RefreshCw, Github } from "lucide-react";
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
  } = useSites();
  const [session, setSession] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string>("default");

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

          <div className="flex items-center gap-3">
            {/* 同步状态 */}
            <SyncStatus />

            {/* 认证按钮 */}
            {session ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <img
                    src={session.user.avatar}
                    alt={session.user.name}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="font-medium text-gray-700">
                    {session.user.name}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGitHubLogout}
                  className="flex items-center gap-1 px-2"
                  title="退出登录"
                >
                  <LogOut className="w-3 h-3" />
                </Button>
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
              onClick={() => {
                const name = prompt("输入分类名称");
                if (name) {
                  const { useSites } = require("@/contexts/SitesContext");
                  const { addCategory } = useSites();
                  addCategory({
                    id: `cat_${Date.now()}`,
                    name,
                    sites: [],
                  });
                }
              }}
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
              onClick={() => {
                const name = prompt("输入分类名称");
                if (name) {
                  const { useSites } = require("@/contexts/SitesContext");
                  const { addCategory } = useSites();
                  addCategory({
                    id: `cat_${Date.now()}`,
                    name,
                    sites: [],
                  });
                }
              }}
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

        {/* 底部操作区 */}
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshSites}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            刷新数据
          </Button>
        </div>
      </main>
    </div>
  );
}
