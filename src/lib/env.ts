/**
 * 环境变量验证
 * 确保所有必需的环境变量都已正确设置
 */

import { z } from "zod";

/**
 * 环境变量 Schema
 */
const envSchema = z.object({
  // Node 环境
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // GitHub OAuth 配置
  NEXT_PUBLIC_GITHUB_CLIENT_ID: z.string().min(1, "GitHub Client ID 未设置"),

  // 可选：GitHub 仓库配置（使用默认值如果未设置）
  NEXT_PUBLIC_GITHUB_OWNER: z.string().default("wu529778790"),
  NEXT_PUBLIC_GITHUB_REPO: z.string().default("navhub.shenzjd.com"),
});

/**
 * 验证后的环境变量类型
 */
export type Env = z.infer<typeof envSchema>;

/**
 * 验证环境变量
 * @throws {Error} 如果验证失败
 */
function validateEnv(): Env {
  try {
    // 只验证浏览器可访问的环境变量（NEXT_PUBLIC_*）
    const browserEnv = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_GITHUB_CLIENT_ID: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
      NEXT_PUBLIC_GITHUB_OWNER: process.env.NEXT_PUBLIC_GITHUB_OWNER,
      NEXT_PUBLIC_GITHUB_REPO: process.env.NEXT_PUBLIC_GITHUB_REPO,
    };

    return envSchema.parse(browserEnv);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((issue) => issue.message);
      throw new Error(`环境变量验证失败:\n${messages.join("\n")}`);
    }
    throw error;
  }
}

/**
 * 获取验证后的环境变量
 * 这个函数在首次调用时会验证环境变量，之后返回缓存的结果
 */
let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
}

/**
 * 检查是否为开发环境
 */
export function isDevelopment(): boolean {
  return getEnv().NODE_ENV === "development";
}

/**
 * 检查是否为生产环境
 */
export function isProduction(): boolean {
  return getEnv().NODE_ENV === "production";
}

/**
 * 检查是否为测试环境
 */
export function isTest(): boolean {
  return getEnv().NODE_ENV === "test";
}

/**
 * 获取 GitHub Client ID
 */
export function getGitHubClientId(): string {
  return getEnv().NEXT_PUBLIC_GITHUB_CLIENT_ID;
}

/**
 * 获取 GitHub 仓库所有者
 */
export function getGitHubOwner(): string {
  return getEnv().NEXT_PUBLIC_GITHUB_OWNER;
}

/**
 * 获取 GitHub 仓库名称
 */
export function getGitHubRepo(): string {
  return getEnv().NEXT_PUBLIC_GITHUB_REPO;
}
