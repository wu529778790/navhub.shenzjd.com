import { NextRequest, NextResponse } from "next/server";
import { URL_PARSER_CONFIG } from "@/lib/config";
import { normalizeExternalAssetUrl } from "@/lib/runtime-policies";

interface ParsedResult {
  title: string;
  favicon: string;
  source: "html" | "microlink" | "noembed" | "fallback";
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = URL_PARSER_CONFIG.CACHE_MAX_ENTRIES;
const cache = new Map<string, { data: ParsedResult; expiresAt: number }>();
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwarded) return forwarded.split(",")[0].trim();
  if (realIp) return realIp;
  return "unknown";
}

function checkRateLimit(identifier: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const maxRequests = URL_PARSER_CONFIG.RATE_LIMIT_MAX_REQUESTS;
  const windowMs = URL_PARSER_CONFIG.RATE_LIMIT_WINDOW_MS;
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (record.count >= maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  record.count += 1;
  rateLimitStore.set(identifier, record);
  return { allowed: true, retryAfterSeconds: 0 };
}

function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

function cleanupExpiredCache(): void {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (value.expiresAt <= now) {
      cache.delete(key);
    }
  }
}

function setBoundedCache(key: string, data: ParsedResult): void {
  if (cache.has(key)) {
    cache.delete(key);
  }

  cache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  while (cache.size > CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (!oldestKey) break;
    cache.delete(oldestKey);
  }
}

function normalizeUrl(input: string): URL {
  const parsed = new URL(input);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("只支持 http/https 协议");
  }
  return parsed;
}

const BLOCKED_HOSTNAMES: readonly RegExp[] = [
  /^127\./,
  /^0\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/,
  /^fc/,
  /^fd/,
  /^fe80:/,
  /^localhost$/i,
  /^metadata\.google\.internal$/i,
];

function isBlockedHostname(hostname: string): boolean {
  return BLOCKED_HOSTNAMES.some((re) => re.test(hostname));
}

function assertSafeUrl(parsed: URL): void {
  if (isBlockedHostname(parsed.hostname)) {
    throw new Error("不允许访问该地址");
  }
}

function titleFromHostname(hostname: string): string {
  const base = hostname.replace(/^www\./i, "").split(".")[0] || "website";
  return (
    base
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase()) || "未命名网站"
  );
}

function googleS2(hostname: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;
}

function absolutizeUrl(candidate: string, base: URL): string | null {
  try {
    return new URL(candidate, base).toString();
  } catch {
    return null;
  }
}

function cleanupText(value?: string): string {
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim();
}

function extractMeta(html: string, key: string): string {
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

function extractTitleTag(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return cleanupText(match?.[1] || "");
}

function extractIconHref(html: string): string {
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

async function fetchJsonWithTimeout(url: string, timeoutMs: number) {
  const response = await fetch(url, {
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

async function resolveFromHtml(target: string): Promise<{ title?: string; icon?: string } | null> {
  try {
    const response = await fetch(target, {
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NavHubBot/1.0; +https://navhub.shenzjd.com)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const finalUrl = new URL(response.url || target);
    const contentType = response.headers.get("content-type")?.toLowerCase() || "";
    if (
      contentType &&
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml")
    ) {
      return null;
    }

    const html = (await response.text()).slice(0, 300_000);

    const title =
      extractMeta(html, "og:title") || extractMeta(html, "twitter:title") || extractTitleTag(html);

    const iconHref = extractIconHref(html) || extractMeta(html, "og:image") || "";

    const icon =
      (iconHref ? absolutizeUrl(iconHref, finalUrl) : null) || `${finalUrl.origin}/favicon.ico`;

    return {
      title: title || undefined,
      icon: icon || undefined,
    };
  } catch {
    return null;
  }
}

async function resolveMicrolink(target: string): Promise<{ title?: string; icon?: string } | null> {
  try {
    const data = await fetchJsonWithTimeout(
      `https://api.microlink.io/?url=${encodeURIComponent(target)}&screenshot=false&meta=false&audio=false&video=false`,
      7000
    );

    return {
      title: data?.data?.title || undefined,
      icon: data?.data?.logo?.url || data?.data?.image?.url || undefined,
    };
  } catch {
    return null;
  }
}

async function resolveNoembed(target: string): Promise<{ title?: string } | null> {
  try {
    const data = await fetchJsonWithTimeout(
      `https://noembed.com/embed?url=${encodeURIComponent(target)}`,
      5000
    );

    return {
      title: data?.title || undefined,
    };
  } catch {
    return null;
  }
}

function chooseFavicon(urlObj: URL, fromProvider?: string): string {
  if (fromProvider) return normalizeExternalAssetUrl(fromProvider);

  const hostname = urlObj.hostname;
  return `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
}

export async function GET(request: NextRequest) {
  cleanupRateLimitStore();
  cleanupExpiredCache();

  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试" },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      }
    );
  }

  const urlParam = request.nextUrl.searchParams.get("url")?.trim();
  if (!urlParam) {
    return NextResponse.json({ error: "缺少 url 参数" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = normalizeUrl(urlParam);
    assertSafeUrl(parsedUrl);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "URL 无效" },
      { status: 400 }
    );
  }

  const cacheKey = parsedUrl.toString();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data);
  }
  if (cached && cached.expiresAt <= Date.now()) {
    cache.delete(cacheKey);
  }

  const microlink = await resolveMicrolink(cacheKey);

  let noembed: Awaited<ReturnType<typeof resolveNoembed>> = null;
  if (!microlink?.title) {
    noembed = await resolveNoembed(cacheKey);
  }

  let html: Awaited<ReturnType<typeof resolveFromHtml>> = null;
  if (!microlink?.icon || (!microlink?.title && !noembed?.title)) {
    html = await resolveFromHtml(cacheKey);
  }

  const title =
    microlink?.title || noembed?.title || html?.title || titleFromHostname(parsedUrl.hostname);

  const favicon =
    chooseFavicon(parsedUrl, microlink?.icon || html?.icon) || googleS2(parsedUrl.hostname);

  const source: ParsedResult["source"] =
    microlink?.title || microlink?.icon
      ? "microlink"
      : noembed?.title
        ? "noembed"
        : html?.title || html?.icon
          ? "html"
          : "fallback";

  const result: ParsedResult = {
    title,
    favicon,
    source,
  };

  setBoundedCache(cacheKey, result);

  return NextResponse.json(result);
}
