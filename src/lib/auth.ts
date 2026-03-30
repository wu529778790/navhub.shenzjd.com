/**
 * 认证管理
 * 登录态由服务端 HttpOnly Cookie 持有，前端只通过会话接口获取用户信息。
 */

export interface AuthState {
  token: string | null;
  user: {
    id: string;
    name: string;
    avatar: string;
  } | null;
}

let cachedAuthState: AuthState = { token: null, user: null };

export async function getAuthState(forceRefresh: boolean = false): Promise<AuthState> {
  if (!forceRefresh && (cachedAuthState.token || cachedAuthState.user)) {
    return cachedAuthState;
  }

  if (typeof window === "undefined") {
    return { token: null, user: null };
  }

  try {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
    });

    if (!response.ok) {
      cachedAuthState = { token: null, user: null };
      return cachedAuthState;
    }

    const payload = (await response.json()) as {
      authenticated: boolean;
      user: AuthState["user"];
    };

    cachedAuthState = {
      token: payload.authenticated ? "cookie-session" : null,
      user: payload.authenticated ? payload.user : null,
    };

    return cachedAuthState;
  } catch (error) {
    console.error("获取认证状态失败:", error);
    cachedAuthState = { token: null, user: null };
    return cachedAuthState;
  }
}

export async function clearAuth(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
  } catch (error) {
    console.error("登出请求失败:", error);
  } finally {
    // 清理历史版本残留
    try {
      localStorage.removeItem("github_token");
      localStorage.removeItem("github_user");
      sessionStorage.removeItem("github_token");
      sessionStorage.removeItem("github_user");
    } catch {
      // ignore
    }
    cachedAuthState = { token: null, user: null };
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const auth = await getAuthState();
  return !!auth.token;
}
