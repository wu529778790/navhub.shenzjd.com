/**\n * GitHub OAuth 回调 API\n * 处理 GitHub 授权后的回调，交换 code 获取 token\n */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // 如果有错误，重定向回首页并显示错误
  if (error) {
    return NextResponse.redirect(`${origin}/?oauth_error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/?oauth_error=missing_code`);
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
        `${origin}/?oauth_error=${encodeURIComponent(data.error_description || data.error)}`
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
    const redirectUrl = `${origin}/?token=${encodeURIComponent(token)}&user_id=${encodeURIComponent(userData.id.toString())}&user_name=${encodeURIComponent(userData.name || userData.login)}&user_avatar=${encodeURIComponent(userData.avatar_url)}`;

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error("OAuth callback error:", error);
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    return NextResponse.redirect(`${origin}/?oauth_error=${encodeURIComponent(errorMessage)}`);
  }
}
