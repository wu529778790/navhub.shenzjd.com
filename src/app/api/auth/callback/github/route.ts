/**
 * GitHub OAuth 回调 API
 * 处理 GitHub 授权后的回调，交换 code 获取 token
 */

import { NextRequest, NextResponse } from "next/server";
import { validateOrigin, checkRateLimit, getClientIP } from "@/lib/security";
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

  // 强制验证 OAuth state 参数（CSRF 保护）
  if (!state || !storedState || state !== storedState) {
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

    const authPayload = {
      token,
      user: {
        id: String(userData.id),
        name: String(userData.name || userData.login),
        avatar: String(userData.avatar_url),
      },
    };

    // 避免 URL query 暴露 token：返回一个中间页脚本写入 storage 后跳回首页
    const payloadJson = JSON.stringify(authPayload).replace(/</g, "\\u003c");
    const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>登录处理中</title>
  </head>
  <body>
    <p>登录处理中，请稍候...</p>
    <script>
      (function () {
        const payload = ${payloadJson};
        try {
          localStorage.setItem("github_token", payload.token);
          localStorage.setItem("github_user", JSON.stringify(payload.user));
          sessionStorage.setItem("github_token", payload.token);
          sessionStorage.setItem("github_user", JSON.stringify(payload.user));
        } catch (e) {}
        window.location.replace("/?oauth_success=1");
      })();
    </script>
  </body>
</html>`;

    const htmlResponse = new NextResponse(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    });
    htmlResponse.cookies.set("oauth_state", "", { path: "/", maxAge: 0 });
    return htmlResponse;

  } catch (error) {
    console.error("OAuth callback error:", error);
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    return NextResponse.redirect(`${origin}/?oauth_error=${encodeURIComponent(errorMessage)}`);
  }
}
