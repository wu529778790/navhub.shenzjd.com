import { NextRequest } from "next/server";
import { cacheInvalidate } from "@/lib/server/cache";

/**
 * 导航数据缓存失效入口（供 navagent 同步侧调用）。
 *
 * navagent 每日爬取后直接写 Turso，不经过本应用的任何写路径，
 * 进程内 6h TTL 缓存感知不到变更——同步完成后调用本端点立即失效，
 * 下一次首页/分类页访问即读到新树，避免「同步了但前台半天不更新」。
 *
 * 鉴权：x-revalidate-key 与服务端 REVALIDATE_KEY 比对（时序安全）。
 * REVALIDATE_KEY 未配置时端点关闭（返回 503），防止匿名刷缓存。
 */
const NAV_CACHE_KEY = "nav:data";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function POST(request: NextRequest) {
  const expected = process.env.REVALIDATE_KEY;
  if (!expected) {
    return Response.json({ error: "revalidate disabled" }, { status: 503 });
  }
  const provided = request.headers.get("x-revalidate-key") ?? "";
  if (!provided || !timingSafeEqual(provided, expected)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  cacheInvalidate(NAV_CACHE_KEY);
  return Response.json({ ok: true, invalidated: NAV_CACHE_KEY });
}
