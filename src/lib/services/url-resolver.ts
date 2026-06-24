/**
 * URL 解析服务
 * 提取自 /api/url/parse 路由，独立为可复用模块
 * 负责：URL 元数据提取（标题、favicon）
 */

import {
  readResponseTextWithLimit,
  safeFetchExternalUrl,
} from "@/lib/server/safe-external-fetch";
import { normalizeExternalAssetUrl } from "@/lib/runtime-policies";

export interface ParsedResult {
  title: string;
  favicon: string;
  source: "html" | "microlink" | "noembed" | "fallback";
}

/** 默认缓存 TTL: 24 小时 */
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
/** 最大缓存条目数 */
const DEFAULT_CACHE_MAX_ENTRIES = 200;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * 有界缓存（防止内存泄漏）
 */
export class BoundedCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxEntries: number;

  constructor(maxEntries = DEFAULT_CACHE_MAX_ENTRIES) {
    this.maxEntries = maxEntries;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T, ttlMs = DEFAULT_CACHE_TTL_MS): void {
    // 删除旧条目（如果存在），避免 LRU 问题
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    this.cache.set(key, { data, expiresAt: Date.now() + ttlMs });

    // 超出上限时删除最旧条目
    while (this.cache.size > this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (!oldestKey) break;
      this.cache.delete(oldestKey);
    }
  }

  /** 清理过期条目 */
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }

  get size(): number {
    return this.cache.size;
  }
}

// 全局单例缓存
export const urlParseCache = new BoundedCache<ParsedResult>();

/**
 * 标准化 URL（仅支持 http/https）
 */
export function normalizeUrl(input: string): URL {
  const parsed = new URL(input);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("只支持 http/https 协议");
  }
  return parsed;
}

/**
 * 从主机名生成默认标题
 */
export function titleFromHostname(hostname: string): string {
  const base = hostname.replace(/^www\./i, "").split(".")[0] || "website";
  return (
    base
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase()) || "未命名网站"
  );
}

/**
 * 获取 Google Favicon 服务 URL
 */
export function googleS2(hostname: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;
}

/**
 * 相对路径转绝对路径
 */
export function absolutizeUrl(candidate: string, base: URL): string | null {
  try {
    return new URL(candidate, base).toString();
  } catch {
    return null;
  }
}

/** 清理文本（去除多余空白） */
export function cleanupText(value?: string): string {
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim();
}

/** 从 HTML 提取 meta 标签内容 */
export function extractMeta(html: string, key: string): string {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["'][^>]*>`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return cleanupText(match[1]);
    }
  }

  return "";
}

/** 从 HTML 提取 <title> 标签 */
export function extractTitleTag(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return cleanupText(match?.[1] || "");
}

/** 从 HTML 提取 favicon 链接 */
export function extractIconHref(html: string): string {
  const linkRegex = /<link\b[^>]*>/gi;
  const links = html.match(linkRegex) || [];

  for (const link of links) {
    const rel = link.match(/\brel\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase() || "";
    if (!rel.includes("icon")) continue;

    const href = link.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1] || "";
    if (href) return href;
  }

  return "";
}

/** JSON 请求封装（带超时） */
async function fetchJsonWithTimeout(url: string, timeoutMs: number): Promise<unknown> {
  const response = await safeFetchExternalUrl(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; NavHubBot/1.0; +https://navhub.shenzjd.com)",
      Accept: "application/json,text/plain,*/*",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * 从 HTML 直接解析元数据
 */
export async function resolveFromHtml(target: string): Promise<{ title?: string; icon?: string } | null> {
  try {
    const response = await safeFetchExternalUrl(target, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NavHubBot/1.0; +https://navhub.shenzjd.com)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const finalUrl = new URL(response.url || target);
    const contentType = response.headers.get("content-type")?.toLowerCase() || "";
    if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return null;
    }

    const html = await readResponseTextWithLimit(response, 300_000);

    const title =
      extractMeta(html, "og:title") || extractMeta(html, "twitter:title") || extractTitleTag(html);
    const iconHref = extractIconHref(html) || extractMeta(html, "og:image") || "";

    const icon =
      (iconHref ? absolutizeUrl(iconHref, finalUrl) : null) || `${finalUrl.origin}/favicon.ico`;

    return { title: title || undefined, icon: icon || undefined };
  } catch {
    return null;
  }
}

/**
 * 通过 Microlink API 解析
 */
export async function resolveMicrolink(target: string): Promise<{ title?: string; icon?: string } | null> {
  try {
    const data = (await fetchJsonWithTimeout(
      `https://api.microlink.io/?url=${encodeURIComponent(target)}&screenshot=false&meta=false&audio=false&video=false`,
      7000
    )) as Record<string, unknown>;

    const dataObj = data?.data as Record<string, unknown> | undefined;
    return {
      title: dataObj?.title as string | undefined,
      icon: ((dataObj?.logo as Record<string, unknown>)?.url ||
        (dataObj?.image as Record<string, unknown>)?.url) as string | undefined,
    };
  } catch {
    return null;
  }
}

/**
 * 通过 Noembed API 解析（仅标题）
 */
export async function resolveNoembed(target: string): Promise<{ title?: string } | null> {
  try {
    const data = (await fetchJsonWithTimeout(
      `https://noembed.com/embed?url=${encodeURIComponent(target)}`,
      5000
    )) as { title?: string };

    return { title: data.title };
  } catch {
    return null;
  }
}

/**
 * 选择最佳 favicon URL
 */
export function chooseFavicon(urlObj: URL, fromProvider?: string): string {
  if (fromProvider) return normalizeExternalAssetUrl(fromProvider);

  const hostname = urlObj.hostname;
  return `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
}

/**
 * 完整的 URL 解析流程
 * 策略：microlink → noembed → HTML → fallback
 */
export async function resolveUrl(urlParam: string): Promise<ParsedResult> {
  const parsedUrl = normalizeUrl(urlParam);

  // 检查缓存
  const cacheKey = parsedUrl.toString();
  const cached = urlParseCache.get(cacheKey);
  if (cached) return cached;

  // 多策略解析
  const microlink = await resolveMicrolink(cacheKey);

  let noembed: Awaited<ReturnType<typeof resolveNoembed>> = null;
  if (!microlink?.title) {
    noembed = await resolveNoembed(cacheKey);
  }

  let html: Awaited<ReturnType<typeof resolveFromHtml>> = null;
  if (!microlink?.icon || (!microlink?.title && !noembed?.title)) {
    html = await resolveFromHtml(cacheKey);
  }

  // 合并结果
  const title =
    microlink?.title || noembed?.title || html?.title || titleFromHostname(parsedUrl.hostname);
  const favicon =
    chooseFavicon(parsedUrl, microlink?.icon || html?.icon) || googleS2(parsedUrl.hostname);

  const source: ParsedResult["source"] = microlink?.title || microlink?.icon
    ? "microlink"
    : noembed?.title
      ? "noembed"
      : html?.title || html?.icon
        ? "html"
        : "fallback";

  const result: ParsedResult = { title, favicon, source };
  urlParseCache.set(cacheKey, result);
  return result;
}
