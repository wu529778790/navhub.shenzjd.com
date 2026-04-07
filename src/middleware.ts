import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Prevent CDN from caching HTML pages (static assets keep their own immutable cache)
  // CSP is set in next.config.ts (same buildContentSecurityPolicy) so HTML + edge stay in sync.

  response.headers.set("Cache-Control", "public, max-age=0, s-maxage=0, must-revalidate");
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

  return response;}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw\\.js).*)"],
};
