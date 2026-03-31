const DUCKDUCKGO_FAVICON_PREFIX = "https://icons.duckduckgo.com/ip3/";
const FAVICON_PROXY_PREFIX = "/api/favicon?src=";

function googleS2(hostname: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;
}

function normalizeHttpUrl(url: string): string {
  if (url.startsWith("http://")) {
    return `https://${url.slice("http://".length)}`;
  }

  return url;
}

export function buildFaviconProxyUrl(src?: string): string | undefined {
  if (!src) {
    return undefined;
  }

  const normalizedSrc = src.startsWith("//") ? `https:${src}` : src;

  if (
    normalizedSrc.startsWith("data:") ||
    (normalizedSrc.startsWith("/") && !normalizedSrc.startsWith("//")) ||
    normalizedSrc.startsWith(FAVICON_PROXY_PREFIX)
  ) {
    return normalizedSrc;
  }

  return `/api/favicon?src=${encodeURIComponent(normalizedSrc)}`;
}

export function getRenderableFaviconUrl(src?: string): string | undefined {
  if (!src) {
    return undefined;
  }

  const normalizedUrl = normalizeHttpUrl(src);

  if (normalizedUrl.startsWith(DUCKDUCKGO_FAVICON_PREFIX)) {
    const hostname = normalizedUrl
      .slice(DUCKDUCKGO_FAVICON_PREFIX.length)
      .replace(/\.ico(?:\?.*)?$/i, "");

    if (hostname) {
      return buildFaviconProxyUrl(googleS2(hostname));
    }
  }

  return buildFaviconProxyUrl(normalizedUrl);
}
