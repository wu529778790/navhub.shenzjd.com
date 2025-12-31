/**\n * GitHub OAuth 回调页面\n * 处理 GitHub 授权后的回调，获取 token 并存储\n */

"use client";

import { useEffect, useState } from "react";
import { setGitHubToken, setGitHubUser } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface GitHubUser {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
}

export default function GitHubCallback() {
  const [status, setStatus] = useState("处理中...");
  const router = useRouter();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    // 从 URL 获取 code
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    if (error) {
      setStatus(`授权失败: ${error}`);
      setTimeout(() => router.push("/"), 3000);
      return;
    }

    if (!code) {
      setStatus("未找到授权码");
      setTimeout(() => router.push("/"), 3000);
      return;
    }

    try {
      setStatus("正在获取访问令牌...");

      // 交换 code 获取 token
      // 注意：这里需要后端 API 来安全地交换 code
      // 简化方案：直接使用 GitHub API（需要配置 CLIENT_SECRET）

      const response = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: code,
        }),
      });

      if (!response.ok) {
        throw new Error("获取 token 失败");
      }

      const data = await response.json();

      if (data.error) {
        setStatus(`错误: ${data.error_description || data.error}`);
        setTimeout(() => router.push("/"), 3000);
        return;
      }

      const token = data.access_token;

      // 获取用户信息
      setStatus("正在获取用户信息...");
      const userResponse = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      });

      if (!userResponse.ok) {
        throw new Error("获取用户信息失败");
      }

      const userData: GitHubUser = await userResponse.json();

      // 存储 token 和用户信息
      setGitHubToken(token);
      setGitHubUser({
        id: userData.id.toString(),
        name: userData.name || userData.login,
        avatar: userData.avatar_url,
      });

      setStatus("登录成功！正在跳转...");

      // 清除 URL 参数并跳转
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);

    } catch (error) {
      console.error("OAuth 回调处理失败:", error);
      setStatus(`处理失败: ${error instanceof Error ? error.message : "未知错误"}`);
      setTimeout(() => router.push("/"), 3000);
    }
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
