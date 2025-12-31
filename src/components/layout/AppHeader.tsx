/**
 * 应用头部组件
 */

"use client";

import { useState, useEffect } from "react";
import { useSites } from "@/contexts/SitesContext";
import { SyncStatus } from "@/components/SyncStatus";
import { Button } from "@/components/ui/button";
import { LogOut, Github, Star, ChevronDown, Settings } from "lucide-react";
import { getAuthState, clearAuth, setGitHubToken, setGitHubUser } from "@/lib/auth";
import { useRouter } from "next/navigation";

const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "";

export function AppHeader() {
  const router = useRouter();
  const { isOnline } = useSites();

  const [session, setSession] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showForkModal, setShowForkModal] = useState(false);

  // 检查认证状态
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
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (token && userId && userName && userAvatar) {
      setGitHubToken(token);
      setGitHubUser({ id: userId, name: userName, avatar: userAvatar });
      setSession({ user: { id: userId, name: userName, avatar: userAvatar }, token });
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(() => window.location.reload(), 100);
      return;
    }

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
    setShowForkModal(true);
  };

  const confirmForkAndLogin = () => {
    setShowForkModal(false);
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/callback/github`);
    const scope = encodeURIComponent("repo gist");
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}`;
  };

  const handleGitHubLogout = () => {
    if (confirm("确定要退出登录吗？")) {
      clearAuth();
      setSession(null);
      window.location.reload();
    }
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

  return (
    <>
      {/* 离线提示 */}
      {!isOnline && (
        <div className="bg-warning/10 text-warning border-b border-warning/20 px-4 py-2 text-sm text-center">
          ⚠️ 当前处于离线状态，数据将保存到本地，恢复网络后自动同步
        </div>
      )}

      {/* 头部 */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="container h-16 flex items-center justify-between">
          {/* 左侧：Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              N
            </div>
            <h1 className="text-xl font-bold tracking-tight">NavHub</h1>
          </div>

          {/* 中间：同步状态 */}
          <div className="hidden md:flex items-center gap-2">
            <SyncStatus />
          </div>

          {/* 右侧：操作区 */}
          <div className="flex items-center gap-2">
            {/* GitHub Star */}
            <a
              href="https://github.com/wu529778790/navhub.shenzjd.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-sm"
            >
              <Star className="w-4 h-4" />
              Star
            </a>

            {/* 认证按钮 */}
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <img
                    src={session.user.avatar}
                    alt={session.user.name}
                    className="w-7 h-7 rounded-full"
                  />
                  <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-800 py-2 z-50">
                    <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-800">
                      <div className="font-medium text-sm">{session.user.name}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">已登录</div>
                    </div>
                    <button
                      onClick={() => router.push("/settings")}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      设置
                    </button>
                    <button
                      onClick={handleGitHubLogout}
                      className="w-full text-left px-4 py-2 text-sm text-error hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button size="sm" onClick={handleGitHubLogin} className="gap-1">
                <Github className="w-4 h-4" />
                登录
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Fork 确认模态框 */}
      {showForkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 fade-in">
          <div className="card max-w-md w-full p-6 scale-in">
            <div className="flex items-center gap-3 mb-4">
              <Github className="w-6 h-6 text-neutral-900 dark:text-white" />
              <h3 className="text-lg font-semibold">登录确认</h3>
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400 space-y-3 mb-6">
              <p>登录后，系统会自动 Fork 仓库 <code className="bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">wu529778790/navhub.shenzjd.com</code> 到你的 GitHub 账户。</p>
              <p>数据将存放在你的仓库中：</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>文件路径: <code className="bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">data/sites.json</code></li>
                <li>仓库名称: <code className="bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">navhub.shenzjd.com</code></li>
              </ul>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForkModal(false)}>
                取消
              </Button>
              <Button onClick={confirmForkAndLogin}>继续登录</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
