/**
 * URL 解析服务
 * 使用 Microlink API 自动获取网站的 title 和 favicon
 */

interface ParsedURL {
  title: string;
  favicon: string;
}

/**
 * 解析 URL 获取 title 和 favicon
 * 使用 Microlink API
 * @param url - 要解析的 URL
 * @returns Promise<ParsedURL>
 */
export async function parseURL(url: string): Promise<ParsedURL> {
  // 验证 URL 格式
  new URL(url);

  // 使用 Microlink API
  const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}`;
  const response = await fetch(apiUrl, {
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();

  // 从 Microlink 返回的数据中提取 title 和 favicon
  // Microlink 返回 data.data.title 和 data.data.logo.url
  const title = data.data?.title || "";
  const favicon = data.data?.logo?.url || "";

  return { title, favicon };
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
