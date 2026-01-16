/**
 * 认证管理
 * 使用 sessionStorage 存储 GitHub token（更安全，关闭标签页即清除）
 * 如果需要持久化，可以回退到 localStorage
 */

export interface AuthState {
  token: string | null;
  user: {
    id: string;
    name: string;
    avatar: string;
  } | null;
}

// 存储键名
const TOKEN_KEY = "github_token";
const USER_KEY = "github_user";
import { STORAGE_CONFIG } from "@/lib/config";

const USE_PERSISTENT_STORAGE = STORAGE_CONFIG.USE_PERSISTENT_STORAGE;

/**
 * 获取存储对象（根据配置选择 localStorage 或 sessionStorage）
 */
function getStorage(): Storage {
  if (typeof window === "undefined") {
    throw new Error("Storage is only available in browser environment");
  }
  return USE_PERSISTENT_STORAGE ? localStorage : sessionStorage;
}

/**
 * 获取当前认证状态
 */
export function getAuthState(): AuthState {
  if (typeof window === "undefined") {
    return { token: null, user: null };
  }

  try {
    const storage = getStorage();
    const token = storage.getItem(TOKEN_KEY);
    const userData = storage.getItem(USER_KEY);

    if (!token) {
      return { token: null, user: null };
    }

    let user = null;
    if (userData) {
      try {
        user = JSON.parse(userData) as { id: string; name: string; avatar: string };
      } catch {
        // 解析失败，清除无效数据
        storage.removeItem(USER_KEY);
      }
    }

    return { token, user };
  } catch (error) {
    console.error("获取认证状态失败:", error);
    return { token: null, user: null };
  }
}

/**
 * 设置 GitHub token
 */
export function setGitHubToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    // 验证 token 格式（GitHub token 通常是 40 字符的十六进制字符串）
    if (!token || token.length < 20) {
      throw new Error("Invalid token format");
    }

    const storage = getStorage();
    storage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error("设置 token 失败:", error);
    throw new Error("无法保存认证信息");
  }
}

/**
 * 设置用户信息
 */
export function setGitHubUser(user: { id: string; name: string; avatar: string }): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    // 验证用户信息
    if (!user.id || !user.name || !user.avatar) {
      throw new Error("Invalid user data");
    }

    const storage = getStorage();
    storage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("设置用户信息失败:", error);
    throw new Error("无法保存用户信息");
  }
}

/**
 * 清除认证信息
 */
export function clearAuth(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    // 清除两种存储方式的数据（确保完全清除）
    if (localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
    }
    if (localStorage.getItem(USER_KEY)) {
      localStorage.removeItem(USER_KEY);
    }
    if (sessionStorage.getItem(TOKEN_KEY)) {
      sessionStorage.removeItem(TOKEN_KEY);
    }
    if (sessionStorage.getItem(USER_KEY)) {
      sessionStorage.removeItem(USER_KEY);
    }
  } catch (error) {
    console.error("清除认证信息失败:", error);
  }
}

/**
 * 检查是否已认证
 */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const storage = getStorage();
    return !!storage.getItem(TOKEN_KEY);
  } catch {
    return false;
  }
}
