/**
 * GitHub OAuth 回调 API
 * 处理 GitHub 授权后的回调，交换 code 获取 token
 */

import { NextRequest, NextResponse } from "next/server";
import { validateOrigin, checkRateLimit, getClientIP, verifyOAuthState } from "@/lib/security";
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

  const storedState = request.cookies.get("oauth_state")?.value;

  // 强制验证 OAuth state 参数（CSRF 保护，时间安全比较）
  if (!state || !storedState || !verifyOAuthState(state, storedState)) {
    const response = NextResponse.redirect(
      `${origin}/?oauth_error=${encodeURIComponent("Invalid state parameter")}`
    );
    response.cookies.set("oauth_state", "", { path: "/", maxAge: 0 });
    return response;
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
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: OAUTH_CONFIG.CLIENT_ID,
        client_secret: OAUTH_CONFIG.CLIENT_SECRET,
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`HTTP ${tokenResponse.status}: ${tokenResponse.statusText}`);
    }

    const data = await tokenResponse.json();

    if (data.error) {
      return NextResponse.redirect(
        `${origin}/?oauth_error=${encodeURIComponent(data.error_description || data.error)}`
      );
    }

    const token = data.access_token;

    if (!token) {
      return NextResponse.redirect(
        `${origin}/?oauth_error=${encodeURIComponent("Missing access token")}`
      );
    }

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

    const user = {
      id: String(userData.id),
      name: String(userData.name || userData.login),
      avatar: String(userData.avatar_url),
    };

    const redirectResponse = NextResponse.redirect(`${origin}/?oauth_success=1`);
    redirectResponse.cookies.set("github_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    redirectResponse.cookies.set(
      "github_user",
      Buffer.from(JSON.stringify(user), "utf-8").toString("base64url"),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      }
    );
    redirectResponse.cookies.set("oauth_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return redirectResponse;
  } catch (error) {
    console.error("OAuth callback error:", error);
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    return NextResponse.redirect(`${origin}/?oauth_error=${encodeURIComponent(errorMessage)}`);
  }
}
