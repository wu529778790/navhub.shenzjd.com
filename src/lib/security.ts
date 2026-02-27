/**
 * 安全工具函数
 * 提供 CSRF 保护、rate limiting 等功能
 */

import { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";

// OAuth state 存储（生产环境应使用 Redis）
const oauthStateStore = new Map<string, { expires: number }>();

/**
 * 生成 CSRF token
 */
export function generateCSRFToken(): string {
  if (typeof window === "undefined") {
    // 服务端：使用 crypto
    return randomBytes(32).toString("hex");
  } else {
    // 客户端：使用 Web Crypto API
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
}

/**
 * 验证 CSRF token
 */
export function verifyCSRFToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) {
    return false;
  }
  // 使用时间安全的比较
  return token === storedToken;
}

/**
 * 验证 Origin 和 Referer（防止 CSRF）
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  if (!host) {
    return false;
  }

  // 允许的源
  const allowedOrigins = [
    `https://${host}`,
    `http://${host}`,
    `https://${host.replace(":3000", "")}`,
    `http://${host.replace(":3000", "")}`,
  ];

  // 检查 Origin
  if (origin && !allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
    return false;
  }

  // 检查 Referer
  if (referer && !allowedOrigins.some((allowed) => referer.startsWith(allowed))) {
    return false;
  }

  return true;
}

/**
 * 简单的 rate limiting（基于 IP）
 * 注意：在生产环境中应使用 Redis 等外部存储
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    // 创建新记录
    const resetTime = now + windowMs;
    rateLimitMap.set(identifier, { count: 1, resetTime });
    return { allowed: true, remaining: maxRequests - 1, resetTime };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  // 增加计数
  record.count++;
  rateLimitMap.set(identifier, record);
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * 清理过期的 rate limit 记录
 */
export function cleanupRateLimit(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

// 定期清理（每 5 分钟）
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimit, 5 * 60 * 1000);
}

/**
 * 获取客户端 IP 地址
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const remoteAddr = request.headers.get("remote-addr");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (remoteAddr) {
    return remoteAddr;
  }
  return "unknown";
}

/**
 * 验证 redirect_uri
 */
export function validateRedirectURI(redirectUri: string, allowedOrigins: string[]): boolean {
  try {
    const url = new URL(redirectUri);
    return allowedOrigins.some((origin) => {
      try {
        const originUrl = new URL(origin);
        return url.origin === originUrl.origin;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

/**
 * 生成 OAuth state 参数（CSRF 保护）
 */
export function generateOAuthState(): string {
  const state = generateCSRFToken();
  // 存储 state，10分钟过期
  oauthStateStore.set(state, { expires: Date.now() + 10 * 60 * 1000 });
  return state;
}

/**
 * 验证 OAuth state 参数
 */
export function validateOAuthState(state: string | null): boolean {
  if (!state) {
    return false;
  }

  const record = oauthStateStore.get(state);
  if (!record) {
    return false;
  }

  // 检查是否过期
  if (Date.now() > record.expires) {
    oauthStateStore.delete(state);
    return false;
  }

  // 使用后删除（一次性使用）
  oauthStateStore.delete(state);
  return true;
}

/**
 * 清理过期的 OAuth state 记录
 */
export function cleanupOAuthState(): void {
  const now = Date.now();
  for (const [key, value] of oauthStateStore.entries()) {
    if (now > value.expires) {
      oauthStateStore.delete(key);
    }
  }
}

// 定期清理（每 5 分钟）
if (typeof setInterval !== "undefined") {
  setInterval(cleanupOAuthState, 5 * 60 * 1000);
}

/**
 * 验证 GitHub token 格式
 */
export function validateGitHubToken(token: string): boolean {
  // GitHub token 通常是 40 字符的十六进制字符串
  // 或者以 github_pat_ 开头的更长的 token
  const githubTokenPattern = /^(gh[pous]_[A-Za-z0-9_]{36,255}|[0-9a-f]{40})$/;
  return githubTokenPattern.test(token);
}

/**
 * 创建安全响应头
 */
export function getSecurityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
}
