/**\n * GitHub OAuth 回调 API\n * 处理 GitHub 授权后的回调，交换 code 获取 token\n */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // 如果有错误，重定向回首页并显示错误
  if (error) {
    const redirectUrl = new URL("/");
    redirectUrl.searchParams.set("oauth_error", error);
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?oauth_error=missing_code", request.url));
  }

  try {
    // 交换 code 获取 access token
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
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      return NextResponse.redirect(
        new URL(`/?oauth_error=${encodeURIComponent(data.error_description || data.error)}`, request.url)
      );
    }

    const token = data.access_token;

    // 获取用户信息
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!userResponse.ok) {
      throw new Error("Failed to fetch user info");
    }

    const userData = await userResponse.json();

    // 创建重定向 URL，包含 token 和用户信息
    // 使用 URL 参数传递到前端，前端会存储到 localStorage
    const redirectUrl = new URL("/");
    redirectUrl.searchParams.set("token", token);
    redirectUrl.searchParams.set("user_id", userData.id.toString());
    redirectUrl.searchParams.set("user_name", userData.name || userData.login);
    redirectUrl.searchParams.set("user_avatar", userData.avatar_url);

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(`/?oauth_error=${encodeURIComponent(error instanceof Error ? error.message : "未知错误")}`, request.url)
    );
  }
}
