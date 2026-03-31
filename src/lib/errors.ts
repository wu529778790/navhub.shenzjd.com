/**
 * 自定义错误类型 - 用于更好的错误分类和处理
 */

/**
 * GitHub API 错误基类
 */
export class GitHubError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

/**
 * 认证错误 - token 无效或过期
 */
export class AuthError extends GitHubError {
  constructor(message = "认证失败，请重新登录", originalError?: unknown) {
    super(message, "AUTH_ERROR", 401, originalError);
    this.name = "AuthError";
  }
}

/**
 * 网络错误 - 连接失败
 */
export class NetworkError extends GitHubError {
  constructor(message = "网络连接失败，请检查网络设置", originalError?: unknown) {
    super(message, "NETWORK_ERROR", undefined, originalError);
    this.name = "NetworkError";
  }
}

/**
 * 速率限制错误 - API 调用超限
 */
export class RateLimitError extends GitHubError {
  constructor(
    message = "API 调用次数超限，请稍后再试",
    public retryAfter?: number
  ) {
    super(message, "RATE_LIMIT_ERROR", 403);
    this.name = "RateLimitError";
  }
}

/**
 * 仓库错误 - fork 或仓库访问失败
 */
export class RepositoryError extends GitHubError {
  constructor(message: string, statusCode?: number, originalError?: unknown) {
    super(message, "REPOSITORY_ERROR", statusCode, originalError);
    this.name = "RepositoryError";
  }
}

/**
 * 解析错误 - 数据格式错误
 */
export class ParseError extends GitHubError {
  constructor(message = "数据解析失败", originalError?: unknown) {
    super(message, "PARSE_ERROR", undefined, originalError);
    this.name = "ParseError";
  }
}

/**
 * 权限错误 - 没有访问权限
 */
export class PermissionError extends GitHubError {
  constructor(message = "没有访问权限", originalError?: unknown) {
    super(message, "PERMISSION_ERROR", 403, originalError);
    this.name = "PermissionError";
  }
}

/**
 * 访客模式错误 - 未登录时的操作限制
 */
export class GuestModeError extends Error {
  constructor(message = "访客模式，无法修改数据（请登录后操作）") {
    super(message);
    this.name = "GuestModeError";
  }
}

/**
 * 从未知错误中识别并返回适当的错误类型
 */
export function classifyError(error: unknown): GitHubError | Error {
  if (error instanceof GitHubError || error instanceof GuestModeError) {
    return error;
  }

  // Normalize to a shape with status/message
  const err = (error instanceof Error ? error : null) as
    | (Error & { status?: number; headers?: Record<string, string> })
    | null;
  const status = (error as { status?: number })?.status;
  const message = (error as { message?: string })?.message ?? String(error);

  // 检查网络错误
  if (err && (err.message?.includes("fetch") || err.message?.includes("network"))) {
    return new NetworkError(err.message, error);
  }

  // 检查 GitHub API 错误
  if (status === 401) {
    return new AuthError("认证失败，请重新登录", error);
  }

  if (status === 403) {
    if (message?.includes("rate limit")) {
      const retryAfterHeader = (error as { headers?: Record<string, string> })?.headers?.[
        "retry-after"
      ];
      const retryAfter = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : undefined;
      return new RateLimitError("API 调用次数超限，请稍后再试", retryAfter);
    }
    return new PermissionError("没有访问权限", error);
  }

  if (status === 404) {
    return new RepositoryError("仓库不存在，请先 Fork 仓库", 404, error);
  }

  // JSON 解析错误
  if (err instanceof SyntaxError) {
    return new ParseError("数据格式错误", error);
  }

  // 默认返回通用错误
  return new GitHubError(
    error instanceof Error ? error.message : "未知错误",
    "UNKNOWN_ERROR",
    undefined,
    error
  );
}

/**
 * 获取用户友好的错误消息
 */
export function getErrorMessage(error: Error): string {
  if (error instanceof AuthError) {
    return "🔑 " + error.message;
  }
  if (error instanceof NetworkError) {
    return "🌐 " + error.message;
  }
  if (error instanceof RateLimitError) {
    return "⏱️ " + error.message;
  }
  if (error instanceof RepositoryError) {
    return "📦 " + error.message;
  }
  if (error instanceof ParseError) {
    return "📄 " + error.message;
  }
  if (error instanceof PermissionError) {
    return "🔒 " + error.message;
  }
  if (error instanceof GuestModeError) {
    return "👤 " + error.message;
  }
  return "❌ " + error.message;
}
