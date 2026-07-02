/**
 * 客户端 Cookie 读写工具
 *
 * 仅操作 JS 可读写的 cookie（非 HttpOnly）。
 * - HttpOnly 的 github_token / github_user 不可读，只能由服务端读
 * - 在这里设置的 cookie 都是非 HttpOnly 的（供 JS 读取的会话标记）
 *
 * 用途：
 * 1. 在 OAuth callback 落地页（/auth/github/callback）读取 GitHub 返回的 login
 * 2. 登录/登出时维护 login 标记，方便 SyncProvider 做 client-side 用户变更检测
 */

export interface UseCookiesReturn {
  getCookie: (name: string) => string | null;
  setCookie: (name: string, value: string, maxAgeSeconds?: number) => void;
  deleteCookie: (name: string) => void;
}

function parseCookies(): Record<string, string> {
  if (typeof document === "undefined") return {};
  const out: Record<string, string> = {};
  const raw = document.cookie;
  if (!raw) return out;
  for (const part of raw.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    try {
      out[k] = decodeURIComponent(v);
    } catch {
      out[k] = v;
    }
  }
  return out;
}

export function useCookies(): UseCookiesReturn {
  const getCookie = (name: string): string | null => {
    const all = parseCookies();
    return Object.prototype.hasOwnProperty.call(all, name) ? all[name] : null;
  };

  const setCookie = (name: string, value: string, maxAgeSeconds = 60 * 60 * 24 * 30) => {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
  };

  const deleteCookie = (name: string) => {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  };

  return { getCookie, setCookie, deleteCookie };
}
