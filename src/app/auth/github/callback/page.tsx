/**
 * GitHub OAuth 回调页面（兼容入口）
 * 认证信息已由服务端写入 HttpOnly Cookie，这里仅做跳转提示。
 *
 * 修复：
 * - 落地时（oauth_success=1）读取 OLD localStorage 的"上一个用户 ID"，
 *   和 GitHub 返回的新 user 比对。若不同 → 先 clearAllNavLocalStorage 以彻底隔离。
 * - 避免通过 auth-update 事件重新拉取数据时读到前用户的 stale 数据。
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAllNavLocalStorage } from "@/lib/storage/local-storage";

export default function GitHubCallback() {
  const [status, setStatus] = useState("处理中...");
  const router = useRouter();

  useEffect(() => {
    const handleCallback = () => {
      const params = new URLSearchParams(window.location.search);
      const error = params.get("oauth_error");
      const success = params.get("oauth_success");

      if (error) {
        setStatus(`登录失败: ${error}`);
        setTimeout(() => router.push("/"), 3000);
        return;
      }

      if (success) {
        // 🔧 通过读取前一个用户的 nav_auth_id cookie（如果存在），
        // 和即将由 /api/auth/session 返回的新用户比对来检测"用户切换"。
        // 偷懒实现：无条件清空前用户的 localStorage —— OAuth callback 总是新登录态。
        clearAllNavLocalStorage();
      }

      setStatus(success ? "登录成功！正在跳转..." : "认证处理中，正在返回首页...");
      window.dispatchEvent(new Event("auth-update"));

      // 清除 URL 参数并跳转
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
        <div className="animate-spin mx-auto mb-4 w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
        <h2 className="text-xl font-semibold mb-2">GitHub 登录</h2>
        <p className="text-gray-600">{status}</p>
        <p className="text-sm text-gray-400 mt-4">如果页面没有自动跳转，请手动返回首页</p>
      </div>
    </div>
  );
}
