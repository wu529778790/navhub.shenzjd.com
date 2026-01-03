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

  const [session, setSession] = useState<{ user: { id: string; name: string; avatar: string }; token: string } | null>(null);
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
      // 触发自定义事件通知其他组件认证状态已更新
      window.dispatchEvent(new Event('auth-update'));
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
      <header className="sticky top-0 z-40 glass bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)] w-full">
        <div className="h-16 flex items-center justify-between max-w-[1200px] mx-auto px-4 md:px-6">
          {/* 左侧：Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[var(--primary-600)] to-[var(--primary-700)] rounded-[var(--radius-lg)] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[var(--primary-600)]/20">
              N
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gradient">NavHub</h1>
          </div>

          {/* 右侧：同步状态 + 操作区 */}
          <div className="flex items-center gap-2">
            {/* 同步状态 */}
            <SyncStatus />

            {/* GitHub Star */}
            <a
              href="https://github.com/wu529778790/navhub.shenzjd.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--background-secondary)] hover:bg-[var(--muted)] border border-[var(--border)] transition-all duration-200 text-sm font-medium"
            >
              <Star className="w-4 h-4 text-[var(--primary-600)]" />
              Star
            </a>

            {/* 认证按钮 */}
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] hover:bg-[var(--muted)] transition-all duration-200 border border-[var(--border)]"
                >
                  <img
                    src={session.user.avatar}
                    alt={session.user.name}
                    className="w-7 h-7 rounded-[var(--radius-sm)]"
                  />
                  <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-[var(--background)] rounded-[var(--radius-lg)] shadow-xl border border-[var(--border)] py-1 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--background-secondary)]">
                      <div className="font-medium text-sm text-[var(--foreground)]">{session.user.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)] mt-0.5">已登录</div>
                    </div>
                    <button
                      onClick={() => router.push("/settings")}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--muted)] flex items-center gap-2 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-[var(--foreground-secondary)]" />
                      设置
                    </button>
                    <button
                      onClick={handleGitHubLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-[var(--error)] hover:bg-[var(--error)]/10 flex items-center gap-2 transition-colors"
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
                className="gap-2 shadow-md hover:shadow-lg transition-all"
              >
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
