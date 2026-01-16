/**
 * 应用配置
 * 集中管理所有配置项，避免硬编码
 */

// GitHub 仓库配置
export const GITHUB_CONFIG = {
  // 原始仓库信息（可以从环境变量读取）
  ORIGINAL_OWNER: process.env.NEXT_PUBLIC_GITHUB_OWNER || "wu529778790",
  ORIGINAL_REPO: process.env.NEXT_PUBLIC_GITHUB_REPO || "navhub.shenzjd.com",
  DATA_FILE_PATH: process.env.NEXT_PUBLIC_DATA_FILE_PATH || "data/sites.json",
} as const;

// OAuth 配置
export const OAUTH_CONFIG = {
  CLIENT_ID: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "",
  CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || "",
  SCOPE: "repo gist",
} as const;

// 应用配置
export const APP_CONFIG = {
  NAME: "NavHub",
  VERSION: "1.0.0",
  DESCRIPTION: "个人导航网站，支持本地存储和 GitHub 同步",
} as const;

// 存储配置
export const STORAGE_CONFIG = {
  USE_PERSISTENT_STORAGE: true, // true: localStorage, false: sessionStorage
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24小时
  SYNC_DEBOUNCE_MS: 3000, // 3秒防抖
} as const;

// 同步配置
export const SYNC_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 5000, // 5秒
  FORK_WAIT_MS: 2000, // Fork 等待时间
} as const;

// 安全配置
export const SECURITY_CONFIG = {
  RATE_LIMIT_MAX_REQUESTS: 10,
  RATE_LIMIT_WINDOW_MS: 60000, // 1分钟
  OAUTH_RATE_LIMIT_MAX_REQUESTS: 5,
  OAUTH_RATE_LIMIT_WINDOW_MS: 60000, // 1分钟
} as const;

// URL 解析配置
export const URL_PARSER_CONFIG = {
  TIMEOUT_MS: 10000, // 10秒
  API_URL: "https://api.microlink.io",
} as const;

/**
 * 验证配置
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!OAUTH_CONFIG.CLIENT_ID) {
    errors.push("NEXT_PUBLIC_GITHUB_CLIENT_ID 未配置");
  }

  if (!OAUTH_CONFIG.CLIENT_SECRET) {
    errors.push("GITHUB_CLIENT_SECRET 未配置");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
