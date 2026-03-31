/**
 * 应用头部组件
 */

"use client";

import { useState, useEffect } from "react";
import { useSites } from "@/contexts/SitesContext";
import { SyncStatus } from "@/components/SyncStatus";
import { Button } from "@/components/ui/button";
import { LogOut, Github, Star, ChevronDown, Settings, RefreshCw } from "lucide-react";
import { getAuthState, clearAuth } from "@/lib/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { getRuntimePublicConfig, type RuntimePublicConfig } from "@/lib/runtime-public-config";
import Image from "next/image";

export function AppHeader() {
  const { isOnline, manualSync, syncStep } = useSites();
  const { showToast } = useToast();

  const [session, setSession] = useState<{ user: { id: string; name: string; avatar: string }; token: string } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showForkModal, setShowForkModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [githubClientId, setGithubClientId] = useState("");
  const [runtimeConfigLoaded, setRuntimeConfigLoaded] = useState(false);
  const [runtimeConfig, setRuntimeConfig] = useState<RuntimePublicConfig | null>(null);

  useEffect(() => {
    void (async () => {
      const params = new URLSearchParams(window.location.search);
      const oauthError = params.get("oauth_error");
      const oauthSuccess = params.get("oauth_success");

      if (oauthError) {
        showToast(`登录失败: ${oauthError}`, "error");
        window.history.replaceState({}, "", window.location.pathname);
      }

      const auth = await getAuthState(true);
      const loadedRuntimeConfig = await getRuntimePublicConfig().catch(() => null);
      if (loadedRuntimeConfig) {
        setRuntimeConfig(loadedRuntimeConfig);
        setGithubClientId(loadedRuntimeConfig.githubClientId);
      }
      setRuntimeConfigLoaded(true);
      if (auth.token && auth.user) {
        setSession({ user: auth.user, token: auth.token });
        if (oauthSuccess) {
          showToast("登录成功", "success");
        }
        window.history.replaceState({}, "", window.location.pathname);
        window.dispatchEvent(new Event("auth-update"));
      }
    })();
  }, [showToast]);

  const handleGitHubLogin = async () => {
    let clientId = githubClientId;
    if (!clientId) {
      const loadedRuntimeConfig = await getRuntimePublicConfig().catch(() => null);
      if (!loadedRuntimeConfig) {
        setRuntimeConfigLoaded(true);
        showToast("运行时配置加载失败，请稍后重试", "error");
        return;
      }

      setRuntimeConfig(loadedRuntimeConfig);
      clientId = loadedRuntimeConfig.githubClientId;
      setGithubClientId(loadedRuntimeConfig.githubClientId);
      setRuntimeConfigLoaded(true);
    }

    if (!clientId) {
      showToast("请配置 NEXT_PUBLIC_GITHUB_CLIENT_ID 环境变量", "error");
      return;
    }

    setShowForkModal(true);
  };

  const confirmForkAndLogin = () => {
    setShowForkModal(false);
    window.location.href = "/api/auth/github/login";
  };

  const handleGitHubLogout = () => {
    if (confirm("确定要退出登录吗？")) {
      void (async () => {
        await clearAuth();
        setSession(null);
        window.dispatchEvent(new Event("auth-update"));
        window.location.reload();
      })();
    }
  };

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
        if (result.direction === "upload") successMsg = "📤 " + (result.message || "上传成功");
        if (result.direction === "download") successMsg = "📥 " + (result.message || "下载成功");
        if (result.direction === "none") successMsg = "✅ " + (result.message || "数据已同步");
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

  useEffect(() => {
    if (!showUserMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".user-menu-container")) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showUserMenu]);

  useEffect(() => {
    const handleOpenSettings = () => {
      setShowSettingsModal(true);
    };

    window.addEventListener("open-settings", handleOpenSettings);
    return () => window.removeEventListener("open-settings", handleOpenSettings);
  }, []);

  return (
    <>
      {syncStep && (
        <div className="fixed left-0 right-0 top-0 z-50 border-b border-[var(--border)] bg-[var(--background-secondary)]/95 px-4 py-3 backdrop-blur-md">
          <div className="mx-auto max-w-[1200px]">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin text-[var(--primary-600)]" />
              <div className="flex-1">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--foreground)]">{syncStep.label}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">{syncStep.progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--muted)]">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--primary-500)] to-[var(--accent-500)] transition-all duration-300"
                    style={{ width: `${syncStep.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isOnline && (
        <div className="border-b border-warning/35 bg-warning/12 px-4 py-2 text-center text-sm text-[var(--foreground-secondary)]">
          ⚠️ 当前处于离线状态，数据将保存到本地，恢复网络后自动同步
        </div>
      )}

      <header
        className="glass sticky top-0 z-40 w-full border-b border-[var(--border)]"
        style={{ marginTop: syncStep ? "60px" : "0px" }}
      >
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 md:px-6">
          <div className="flex cursor-pointer items-center gap-3" onClick={() => (window.location.href = "/")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--primary-200)] bg-gradient-to-br from-[var(--primary-600)] to-[var(--primary-800)] text-lg font-bold text-white shadow-[0_12px_24px_-14px_rgba(15,108,97,0.85)]">
              N
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-gradient">NavHub</h1>
          </div>

          <div className="flex items-center gap-2">
            <SyncStatus />

            <a
              href={`https://github.com/${runtimeConfig?.githubOwner || "wu529778790"}/${runtimeConfig?.githubRepo || "navhub.shenzjd.com"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-1.5 text-sm font-semibold text-[var(--foreground-secondary)] transition-colors hover:border-[var(--primary-300)] hover:text-[var(--primary-700)] sm:flex"
            >
              <Star className="h-4 w-4 text-[var(--accent-600)]" />
              Star
            </a>

            {session ? (
              <div className="user-menu-container relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-secondary)] px-2.5 py-1.5 transition-colors hover:border-[var(--primary-300)]"
                >
                  <Image src={session.user.avatar} alt={session.user.name} className="h-7 w-7 rounded-[var(--radius-sm)]" width={28} height={28} />
                  <ChevronDown className={`h-4 w-4 text-[var(--foreground-secondary)] transition-transform ${showUserMenu ? "rotate-180" : ""}`} />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-secondary)] shadow-[var(--shadow-lg)]">
                    <div className="border-b border-[var(--border)] bg-[var(--muted)]/70 px-4 py-3">
                      <div className="text-sm font-semibold text-[var(--foreground)]">{session.user.name}</div>
                      <div className="mt-0.5 text-xs text-[var(--muted-foreground)]">已登录</div>
                    </div>
                    <button
                      onClick={() => {
                        setShowSettingsModal(true);
                        setShowUserMenu(false);
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm text-[var(--foreground-secondary)] transition-colors hover:bg-[var(--muted)]"
                    >
                      <Settings className="h-4 w-4" />
                      设置
                    </button>
                    <button
                      onClick={handleGitHubLogout}
                      className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm text-[var(--error)] transition-colors hover:bg-[var(--error)]/10"
                    >
                      <LogOut className="h-4 w-4" />
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  void handleGitHubLogin();
                }}
                disabled={!runtimeConfigLoaded && !githubClientId}
                className="gap-2 shadow-md transition-all hover:shadow-lg"
              >
                <Github className="h-4 w-4" />
                登录
              </Button>
            )}
          </div>
        </div>
      </header>

      {showForkModal && (
        <div className="fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="card scale-in w-full max-w-md p-6">
            <div className="mb-4 flex items-center gap-3">
              <Github className="h-6 w-6 text-[var(--primary-700)]" />
              <h3 className="text-lg font-bold">登录确认</h3>
            </div>
            <div className="mb-6 space-y-3 text-sm text-[var(--foreground-secondary)]">
              <p>
                登录后，系统会自动 Fork 仓库
                <code className="ml-1 rounded bg-[var(--muted)] px-2 py-0.5">
                  {runtimeConfig?.githubOwner || "wu529778790"}/{runtimeConfig?.githubRepo || "navhub.shenzjd.com"}
                </code>
                到你的 GitHub 账户。
              </p>
              <p>数据将存放在你的仓库中：</p>
              <ul className="ml-4 list-inside list-disc space-y-1">
                <li>
                  文件路径: <code className="rounded bg-[var(--muted)] px-2 py-0.5">{runtimeConfig?.dataFilePath || "data/sites.json"}</code>
                </li>
                <li>
                  仓库名称: <code className="rounded bg-[var(--muted)] px-2 py-0.5">{runtimeConfig?.githubRepo || "navhub.shenzjd.com"}</code>
                </li>
              </ul>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForkModal(false)} className="cursor-pointer">
                取消
              </Button>
              <Button onClick={confirmForkAndLogin} className="cursor-pointer">
                继续登录
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>设置</DialogTitle>
            <DialogDescription>管理账户和同步选项</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--foreground-secondary)]">GitHub 账户</h3>
              {session ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/45 p-3">
                    <Image src={session.user.avatar} alt={session.user.name} className="h-10 w-10 rounded-full" width={40} height={40} />
                    <div className="flex-1">
                      <div className="font-semibold">{session.user.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">已登录</div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-[var(--muted-foreground)]">
                    <div>• 数据自动同步到你的 GitHub 仓库</div>
                    <div>
                      • 仓库: <code className="rounded bg-[var(--muted)] px-1.5 py-0.5">{runtimeConfig?.githubRepo || "navhub.shenzjd.com"}</code>
                    </div>
                    <div>
                      • 文件: <code className="rounded bg-[var(--muted)] px-1.5 py-0.5">{runtimeConfig?.dataFilePath || "data/sites.json"}</code>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-[var(--muted-foreground)]">未登录，当前为访客模式（只读示例数据）</div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--foreground-secondary)]">同步状态</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/45 p-2">
                  <div className="text-xs text-[var(--muted-foreground)]">网络状态</div>
                  <div className={isOnline ? "font-semibold text-success" : "font-semibold text-warning"}>{isOnline ? "在线" : "离线"}</div>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/45 p-2">
                  <div className="text-xs text-[var(--muted-foreground)]">登录状态</div>
                  <div className={session ? "font-semibold text-success" : "text-[var(--muted-foreground)]"}>{session ? "已登录" : "未登录"}</div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            {session && (
              <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
                <Button
                  variant="outline"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="h-12 flex-1 cursor-pointer gap-1 text-base font-medium sm:flex-none"
                >
                  <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                  {isSyncing ? "同步中..." : "手动同步"}
                </Button>

                <Button
                  variant="destructive"
                  onClick={handleGitHubLogout}
                  className="h-12 flex-1 cursor-pointer gap-1 text-base font-medium sm:flex-none"
                >
                  <LogOut className="h-4 w-4" />
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
