/**
 * 应用头部组件
 */

"use client";

import { useState, useEffect } from "react";
import { useSites } from "@/contexts/SitesContext";
import { SyncStatus } from "@/components/SyncStatus";
import { Button } from "@/components/ui/button";
import { LogOut, Github, Star, ChevronDown, Settings, RefreshCw } from "lucide-react";
import { getAuthState, clearAuth, setGitHubToken, setGitHubUser } from "@/lib/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useSync } from "@/hooks/use-sync";
import { OAUTH_CONFIG } from "@/lib/config";

const GITHUB_CLIENT_ID = OAUTH_CONFIG.CLIENT_ID;

export function AppHeader() {
  const { isOnline } = useSites();
  const { showToast } = useToast();
  const { manualSync, syncStep } = useSync();

  const [session, setSession] = useState<{ user: { id: string; name: string; avatar: string }; token: string } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showForkModal, setShowForkModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

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
      showToast(`登录失败: ${oauthError}`, "error");
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
      showToast("请配置 NEXT_PUBLIC_GITHUB_CLIENT_ID 环境变量", "error");
      return;
    }
    setShowForkModal(true);
  };

  const confirmForkAndLogin = () => {
    setShowForkModal(false);
    // 使用 API 路由处理 OAuth 回调
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/callback/github`);
    const scope = encodeURIComponent(OAUTH_CONFIG.SCOPE);
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}`;
  };

  // 退出登录
  const handleGitHubLogout = () => {
    if (confirm("确定要退出登录吗？")) {
      clearAuth();
      setSession(null);
      window.location.reload();
    }
  };

  // 手动同步
  const handleManualSync = async () => {
    if (!session) {
      showToast("请先登录", "warning");
      return;
    }
    setIsSyncing(true);
    try {
      const result = await manualSync();
      if (result.success) {
        let successMsg = "同步成功";
        if (result.direction === "upload") {
          successMsg = "📤 " + (result.message || "上传成功");
        } else if (result.direction === "download") {
          successMsg = "📥 " + (result.message || "下载成功");
        } else if (result.direction === "none") {
          successMsg = "✅ " + (result.message || "数据已同步");
        }
        showToast(successMsg, "success");
      } else {
        showToast(result.error || "同步失败", "error");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "同步失败";
      showToast(errorMessage, "error");
    } finally {
      setIsSyncing(false);
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

  // 监听打开设置弹窗事件
  useEffect(() => {
    const handleOpenSettings = () => {
      setShowSettingsModal(true);
    };

    window.addEventListener('open-settings', handleOpenSettings);
    return () => window.removeEventListener('open-settings', handleOpenSettings);
  }, []);

  return (
    <>
      {/* 同步进度条 */}
      {syncStep && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border)] px-4 py-3 shadow-lg">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-[var(--primary-600)] animate-spin" />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">{syncStep.label}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">{syncStep.progress}%</span>
                </div>
                <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-600)] transition-all duration-300 ease-out"
                    style={{ width: `${syncStep.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 离线提示 */}
      {!isOnline && (
        <div className="bg-warning/10 text-warning border-b border-warning/20 px-4 py-2 text-sm text-center">
          ⚠️ 当前处于离线状态，数据将保存到本地，恢复网络后自动同步
        </div>
      )}

      {/* 头部 */}
      <header className="sticky top-0 z-40 glass bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)] w-full transition-all duration-300" style={{ marginTop: syncStep ? '60px' : '0px' }}>
        <div className="h-16 flex items-center justify-between max-w-[1200px] mx-auto px-4 md:px-6">
          {/* 左侧：Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = "/"}>
            <div className="w-9 h-9 bg-gradient-to-br from-[var(--primary-600)] to-[var(--primary-700)] rounded-[var(--radius-lg)] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[var(--primary-600)]/20 hover:scale-105 transition-transform">
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
                  className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] hover:bg-[var(--muted)] transition-all duration-200 border border-[var(--border)] cursor-pointer"
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
                      onClick={() => {
                        setShowSettingsModal(true);
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--muted)] flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-[var(--foreground-secondary)]" />
                      设置
                    </button>
                    <button
                      onClick={handleGitHubLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-[var(--error)] hover:bg-[var(--error)]/10 flex items-center gap-2 transition-colors cursor-pointer"
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
              <Button variant="outline" onClick={() => setShowForkModal(false)} className="cursor-pointer">
                取消
              </Button>
              <Button onClick={confirmForkAndLogin} className="cursor-pointer">继续登录</Button>
            </div>
          </div>
        </div>
      )}

      {/* 设置弹窗 */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>设置</DialogTitle>
            <DialogDescription>管理账户和同步选项</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 账户信息 */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-[var(--foreground-secondary)]">GitHub 账户</h3>
              {session ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)]">
                    <img
                      src={session.user.avatar}
                      alt={session.user.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{session.user.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">已登录</div>
                    </div>
                  </div>

                  <div className="text-xs text-[var(--muted-foreground)] space-y-1">
                    <div>• 数据自动同步到你的 GitHub 仓库</div>
                    <div>• 仓库: <code className="bg-[var(--muted)] px-1.5 py-0.5 rounded">navhub.shenzjd.com</code></div>
                    <div>• 文件: <code className="bg-[var(--muted)] px-1.5 py-0.5 rounded">data/sites.json</code></div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-[var(--muted-foreground)]">
                  未登录，当前为访客模式（只读示例数据）
                </div>
              )}
            </div>

            {/* 同步状态 */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-[var(--foreground-secondary)]">同步状态</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)]">
                  <div className="text-[var(--muted-foreground)] text-xs">网络状态</div>
                  <div className={isOnline ? "text-success font-medium" : "text-warning font-medium"}>
                    {isOnline ? "在线" : "离线"}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)]">
                  <div className="text-[var(--muted-foreground)] text-xs">登录状态</div>
                  <div className={session ? "text-success font-medium" : "text-[var(--muted-foreground)]"}>
                    {session ? "已登录" : "未登录"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            {session && (
              <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="flex-1 sm:flex-none gap-1 h-12 text-base font-medium cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                  {isSyncing ? "同步中..." : "手动同步"}
                </Button>

                <Button
                  variant="destructive"
                  onClick={handleGitHubLogout}
                  className="flex-1 sm:flex-none gap-1 h-12 text-base font-medium cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
