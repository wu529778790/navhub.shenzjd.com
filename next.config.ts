import type { NextConfig } from "next";
import { buildContentSecurityPolicy } from "./src/lib/runtime-policies";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  output: "standalone",
  async headers() {
    const csp = buildContentSecurityPolicy();
    return [
      {
        source: "/((?!_next/static|_next/image|favicon.ico|sw\\.js).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, must-revalidate",
          },
          {
            key: "Content-Security-Policy",
            value: csp,
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
