import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 启用 gzip 压缩
  compress: true,
  // 移除 X-Powered-By 响应头（安全优化）
  poweredByHeader: false,
  // 启用 React 严格模式（开发时检测问题）
  reactStrictMode: true,
};

export default nextConfig;
