export const APP_SHELL_URL = "/";
/** Do not precache `/` — it embeds build-specific chunk URLs and causes stale-shell404s after deploy. */
export const STATIC_CACHE_URLS = [] as const;

export function buildContentSecurityPolicy(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    [
      "img-src 'self' data:",
      "https://avatars.githubusercontent.com",
      "https://www.google.com",
      "https://icons.duckduckgo.com",
      "https://t1.gstatic.com",
      "https:",
    ].join(" "),
    [
      "connect-src 'self'",
      "https://api.github.com",
      "https://raw.githubusercontent.com",
      "https://api.microlink.io",
      "https://noembed.com",
      "https://cloudflareinsights.com",
      "https://fonts.googleapis.com",
      "https://icons.duckduckgo.com",
    ].join(" "),
    "frame-ancestors 'none'",
  ].join("; ");
}

export function normalizeExternalAssetUrl(url: string): string {
  if (url.startsWith("http://")) {
    return `https://${url.slice("http://".length)}`;
  }

  return url;
}
