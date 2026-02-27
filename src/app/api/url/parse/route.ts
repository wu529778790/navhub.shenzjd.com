import { NextRequest, NextResponse } from "next/server";

interface ParsedResult {
  title: string;
  favicon: string;
  source: "html" | "microlink" | "noembed" | "fallback";
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { data: ParsedResult; expiresAt: number }>();

function normalizeUrl(input: string): URL {
  const parsed = new URL(input);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("只支持 http/https 协议");
  }
  return parsed;
}

function titleFromHostname(hostname: string): string {
  const base = hostname.replace(/^www\./i, "").split(".")[0] || "website";
  return base
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase()) || "未命名网站";
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
    new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["'][^>]*>`, "i"),
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
    if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return null;
    }

    const html = (await response.text()).slice(0, 300_000);

    const title =
      extractMeta(html, "og:title") ||
      extractMeta(html, "twitter:title") ||
      extractTitleTag(html);

    const iconHref =
      extractIconHref(html) ||
      extractMeta(html, "og:image") ||
      "";

    const icon =
      (iconHref ? absolutizeUrl(iconHref, finalUrl) : null) ||
      `${finalUrl.origin}/favicon.ico`;

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
  if (fromProvider) return fromProvider;

  const hostname = urlObj.hostname;
  return `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get("url")?.trim();
  if (!urlParam) {
    return NextResponse.json({ error: "缺少 url 参数" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = normalizeUrl(urlParam);
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
    microlink?.title ||
    noembed?.title ||
    html?.title ||
    titleFromHostname(parsedUrl.hostname);

  const favicon =
    chooseFavicon(parsedUrl, microlink?.icon || html?.icon) ||
    googleS2(parsedUrl.hostname);

  const source: ParsedResult["source"] = microlink?.title || microlink?.icon
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

  cache.set(cacheKey, {
    data: result,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return NextResponse.json(result);
}
