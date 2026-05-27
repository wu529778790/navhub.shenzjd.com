import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { buildContentSecurityPolicy } from "@/lib/runtime-policies";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // HTML must not live in shared caches (CDN): `no-store` prevents Cloudflare and browsers
  // from serving stale HTML that references chunks from a previous deployment.
  // Hashed assets under `/_next/static/` stay long-cache/immutable (excluded by matcher).
  response.headers.set("Cache-Control", "no-store");
  // Set CSP here (not only in next.config headers) so prerender/route-cache cannot serve stale CSP.
  response.headers.set("Content-Security-Policy", buildContentSecurityPolicy());
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

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
