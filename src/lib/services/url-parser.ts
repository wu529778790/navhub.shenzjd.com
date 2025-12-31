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
  try {
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
    const title = data.data?.title || "";
    const favicon = data.data?.favicon || getFaviconFallback(url);

    return { title, favicon };
  } catch (error) {
    console.error("URL 解析失败:", error);

    // 解析失败时返回降级方案
    return {
      title: "",
      favicon: getFaviconFallback(url),
    };
  }
}

/**
 * Favicon 降级方案
 * 使用 DuckDuckGo 服务
 */
export function getFaviconFallback(url: string): string {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    // 使用 DuckDuckGo Favicon 服务
    return `https://duckduckgo.com/favicon.ico?domain=${domain}`;
  } catch {
    return "";
  }
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
