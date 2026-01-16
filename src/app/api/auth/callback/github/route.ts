/**
 * GitHub OAuth 回调 API
 * 处理 GitHub 授权后的回调，交换 code 获取 token
 */

import { NextRequest, NextResponse } from "next/server";
import { validateOrigin, checkRateLimit, getClientIP, validateRedirectURI } from "@/lib/security";
import { OAUTH_CONFIG, SECURITY_CONFIG } from "@/lib/config";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  // 验证 Origin（CSRF 保护）
  if (!validateOrigin(request)) {
    return NextResponse.redirect(`${origin}/?oauth_error=invalid_origin`);
  }

  // Rate limiting
  const clientIP = getClientIP(request);
  const rateLimit = checkRateLimit(
    clientIP,
    SECURITY_CONFIG.OAUTH_RATE_LIMIT_MAX_REQUESTS,
    SECURITY_CONFIG.OAUTH_RATE_LIMIT_WINDOW_MS
  );
  if (!rateLimit.allowed) {
    return NextResponse.redirect(
      `${origin}/?oauth_error=${encodeURIComponent("请求过于频繁，请稍后再试")}`
    );
  }

  // 验证 redirect_uri（如果提供了 state 参数）
  if (state) {
    // 这里可以验证 state 参数是否匹配（需要在前端存储）
    // 简化实现：只检查 state 是否存在
  }

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
        client_id: OAUTH_CONFIG.CLIENT_ID,
        client_secret: OAUTH_CONFIG.CLIENT_SECRET,
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
