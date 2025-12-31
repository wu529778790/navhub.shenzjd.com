/**\n * 认证管理\n * 使用 localStorage 存储 GitHub token\n */

export interface AuthState {
  token: string | null;
  user: {
    id: string;
    name: string;
    avatar: string;
  } | null;
}

/**
 * 获取当前认证状态
 */
export function getAuthState(): AuthState {
  if (typeof window === "undefined") {
    return { token: null, user: null };
  }

  const token = localStorage.getItem("github_token");
  const userData = localStorage.getItem("github_user");

  if (!token) {
    return { token: null, user: null };
  }

  let user = null;
  if (userData) {
    try {
      user = JSON.parse(userData);
    } catch {
      // ignore
    }
  }

  return { token, user };
}

/**
 * 设置 GitHub token
 */
export function setGitHubToken(token: string): void {
  localStorage.setItem("github_token", token);
}

/**
 * 设置用户信息
 */
export function setGitHubUser(user: { id: string; name: string; avatar: string }): void {
  localStorage.setItem("github_user", JSON.stringify(user));
}

/**
 * 清除认证信息
 */
export function clearAuth(): void {
  localStorage.removeItem("github_token");
  localStorage.removeItem("github_user");
}

/**
 * 检查是否已认证
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem("github_token");
}
