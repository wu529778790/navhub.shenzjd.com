import { NextRequest, NextResponse } from "next/server";

interface ParsedResult {
  title: string;
  favicon: string;
  source: "microlink" | "noembed" | "fallback";
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

async function fetchJsonWithTimeout(url: string, timeoutMs: number) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      "User-Agent": "NavHub/1.0 (+url-parser)",
      Accept: "application/json,text/plain,*/*",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
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
  const hostname = urlObj.hostname;
  if (fromProvider) return fromProvider;

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
  const noembed = await resolveNoembed(cacheKey);

  const title = microlink?.title || noembed?.title || titleFromHostname(parsedUrl.hostname);
  const favicon = chooseFavicon(parsedUrl, microlink?.icon) || googleS2(parsedUrl.hostname);

  const source: ParsedResult["source"] = microlink?.title || microlink?.icon
    ? "microlink"
    : noembed?.title
      ? "noembed"
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
