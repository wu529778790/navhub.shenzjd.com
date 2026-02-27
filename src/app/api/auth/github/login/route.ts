/**
 * GitHub OAuth 登录入口
 * 统一生成并注入 state，避免客户端直接拼接授权 URL
 */

import { NextRequest, NextResponse } from "next/server";
import { OAUTH_CONFIG } from "@/lib/config";
import { generateCSRFToken } from "@/lib/security";

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);

  if (!OAUTH_CONFIG.CLIENT_ID) {
    return NextResponse.redirect(
      `${origin}/?oauth_error=${encodeURIComponent("NEXT_PUBLIC_GITHUB_CLIENT_ID 未配置")}`
    );
  }

  const state = generateCSRFToken();
  const redirectUri = `${origin}/api/auth/callback/github`;

  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", OAUTH_CONFIG.CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", OAUTH_CONFIG.SCOPE);
  authUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });

  return response;
}
