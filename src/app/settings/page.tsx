/**
 * 设置页面
 */

"use client";

import { useState, useEffect } from "react";
import { useSites } from "@/contexts/SitesContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Github, LogOut, Upload, Download, RefreshCw } from "lucide-react";
import { getAuthState, clearAuth, setGitHubToken, setGitHubUser } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";

const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "";

export default function SettingsPage() {
  const { refreshSites, isGuestMode, isOnline } = useSites();
  const { showToast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [showForkModal, setShowForkModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
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
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/callback/github`);
    const scope = encodeURIComponent("repo gist");
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}`;
  };

  // 退出登录
  const handleLogout = () => {
    if (confirm("确定要退出登录吗？")) {
      clearAuth();
      setSession(null);
      showToast("已退出登录", "info");
      setTimeout(() => window.location.reload(), 500);
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
      await refreshSites(true);
      showToast("同步成功", "success");
    } catch (error) {
      showToast("同步失败", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AppLayout>
      <PageContainer title="设置" description="管理账户和同步选项">
        <div className="space-y-6">
          {/* 账户信息 */}
          <div className="card p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Github className="w-4 h-4" />
              GitHub 账户
            </h3>

            {session ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={session.user.avatar}
                    alt={session.user.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="font-medium">{session.user.name}</div>
                    <div className="text-xs text-neutral-500">已登录</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="gap-1"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                    {isSyncing ? "同步中..." : "手动同步"}
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleLogout}
                    className="gap-1"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </Button>
                </div>

                <div className="text-xs text-neutral-500 space-y-1">
                  <div>• 数据自动同步到你的 GitHub 仓库</div>
                  <div>• 仓库: <code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">navhub.shenzjd.com</code></div>
                  <div>• 文件: <code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">data/sites.json</code></div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  登录后可将数据同步到 GitHub，实现跨设备访问
                </div>
                <Button onClick={handleGitHubLogin} className="gap-2">
                  <Github className="w-4 h-4" />
                  使用 GitHub 登录
                </Button>
              </div>
            )}
          </div>

          {/* 同步状态 */}
          <div className="card p-4">
            <h3 className="font-semibold mb-3">同步状态</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">网络状态</span>
                <span className={isOnline ? "text-success font-medium" : "text-warning font-medium"}>
                  {isOnline ? "在线" : "离线"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">登录状态</span>
                <span className={session ? "text-success font-medium" : "text-neutral-600"}>
                  {session ? "已登录" : "未登录"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">访客模式</span>
                <span className={isGuestMode ? "text-neutral-600" : "text-success font-medium"}>
                  {isGuestMode ? "开启" : "关闭"}
                </span>
              </div>
            </div>
          </div>

          {/* 关于 */}
          <div className="card p-4">
            <h3 className="font-semibold mb-3">关于 NavHub</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
              一个支持 GitHub 同步的个人导航管理工具，帮助你整理和管理常用的网站链接。
            </p>
            <div className="text-xs text-neutral-500 space-y-1">
              <div>• 版本: 1.0.0</div>
              <div>• 技术栈: Next.js 16 + React 19 + TypeScript</div>
              <div>• 拖拽库: @dnd-kit</div>
            </div>
          </div>
        </div>
      </PageContainer>

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
    </AppLayout>
  );
}
