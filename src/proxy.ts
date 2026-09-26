import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { buildContentSecurityPolicy } from "@/lib/runtime-policies";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // Cache-Control 不再由 next.config headers 管理 — HTML 由 proxy 统一写，API 由各 handler 自控。
  response.headers.set("Content-Security-Policy", buildContentSecurityPolicy());
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // HTML 页面缓存（2026-09-26，站点已接入腾讯 EdgeOne）：数据低频变更 + 报失效已客户端化
  // → 允许 CDN 缓存 1 天。首页走 Next ISR 产物缓存；分类页为动态路由（build 期无 Turso，
  // 无法 generateStaticParams，Next 不产出 ISR 缓存），由这里统一补 CDN 缓存头。
  // EdgeOne 侧需将缓存模式设为「遵循源站 Cache-Control」s-maxage 才会生效。
  // s-maxage 只作用于共享缓存（CDN），浏览器不缓存（无 max-age），刷新始终看到最新报告数。
  // 导入新数据后在 EdgeOne 控制台/Purge API 刷新缓存可立即生效，否则边缘最长 1 天回源。
  if (request.nextUrl.pathname === "/" || request.nextUrl.pathname.startsWith("/c/")) {
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=86400, stale-while-revalidate=86400"
    );
  }

  if (request.nextUrl.protocol === "https:") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw\\.js).*)"],
};
