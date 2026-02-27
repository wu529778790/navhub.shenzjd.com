/**
 * URL 解析服务
 * 通过本地 API 做多提供方兜底，提升稳定性
 */

interface ParsedURL {
  title: string;
  favicon: string;
}

interface ParseApiResponse extends ParsedURL {
  source?: "microlink" | "noembed" | "fallback";
}

/**
 * 解析 URL 获取 title 和 favicon
 * 优先请求本地 API（服务端多源兜底）
 */
export async function parseURL(url: string): Promise<ParsedURL> {
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("只支持 http/https 协议");
  }

  const response = await fetch(`/api/url/parse?url=${encodeURIComponent(parsed.toString())}`, {
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`解析失败: HTTP ${response.status}`);
  }

  const data = (await response.json()) as ParseApiResponse;

  return {
    title: data.title || getDomain(parsed.toString()),
    favicon: data.favicon || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(parsed.hostname)}&sz=64`,
  };
}

/**
 * 从 URL 中提取域名
 */
export function getDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}
