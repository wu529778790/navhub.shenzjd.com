/**
 * GitHub OAuth 回调页面
 * 处理 API 路由重定向后的 token 和用户信息
 */

"use client";

import { useEffect, useState } from "react";
import { setGitHubToken, setGitHubUser } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function GitHubCallback() {
  const [status, setStatus] = useState("处理中...");
  const router = useRouter();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    // 从 URL 获取 token 和用户信息（由 API 路由重定向传递）
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userId = params.get("user_id");
    const userName = params.get("user_name");
    const userAvatar = params.get("user_avatar");
    const error = params.get("oauth_error");

    if (error) {
      setStatus(`登录失败: ${error}`);
      setTimeout(() => router.push("/"), 3000);
      return;
    }

    if (!token || !userId || !userName || !userAvatar) {
      setStatus("未找到认证信息");
      setTimeout(() => router.push("/"), 3000);
      return;
    }

    // 存储 token 和用户信息
    setGitHubToken(token);
    setGitHubUser({
      id: userId,
      name: userName,
      avatar: userAvatar,
    });

    setStatus("登录成功！正在跳转...");

    // 清除 URL 参数并跳转
    setTimeout(() => {
      window.location.href = "/";
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
        <div className="animate-spin mx-auto mb-4 w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
        <h2 className="text-xl font-semibold mb-2">GitHub 登录</h2>
        <p className="text-gray-600">{status}</p>
        <p className="text-sm text-gray-400 mt-4">
          如果页面没有自动跳转，请手动返回首页
        </p>
      </div>
    </div>
  );
}