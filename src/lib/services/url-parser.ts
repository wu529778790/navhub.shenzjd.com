/**
 * URL 解析服务
 * 自动获取网站的 title 和 favicon
 */

interface ParsedURL {
  title: string;
  favicon: string;
}

/**
 * 解析 URL 获取 title 和 favicon
 * @param url - 要解析的 URL
 * @returns Promise<ParsedURL>
 */
export async function parseURL(url: string): Promise<ParsedURL> {
  try {
    // 验证 URL 格式
    const urlObj = new URL(url);

    // 尝试通过 allorigins.win 获取 HTML（绕过 CORS）
    const apiUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(apiUrl, {
      signal: AbortSignal.timeout(5000), // 5秒超时
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // 解析 HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(data.contents, "text/html");

    // 获取标题
    const title = extractTitle(doc, urlObj);

    // 获取 favicon
    const favicon = extractFavicon(doc, urlObj);

    return { title, favicon };
  } catch (error) {
    console.error("URL 解析失败:", error);

    // 解析失败时返回默认值
    return {
      title: "",
      favicon: getGoogleFavicon(url),
    };
  }
}

/**
 * 从 HTML 文档中提取标题
 */
function extractTitle(doc: Document, urlObj: URL): string {
  // 1. 尝试获取 <title>
  const titleTag = doc.querySelector("title");
  if (titleTag?.textContent?.trim()) {
    return titleTag.textContent.trim();
  }

  // 2. 尝试获取 og:title
  const ogTitle = doc.querySelector('meta[property="og:title"]');
  if (ogTitle?.getAttribute("content")) {
    return ogTitle.getAttribute("content")!.trim();
  }

  // 3. 尝试获取 twitter:title
  const twitterTitle = doc.querySelector('meta[name="twitter:title"]');
  if (twitterTitle?.getAttribute("content")) {
    return twitterTitle.getAttribute("content")!.trim();
  }

  // 4. 使用域名作为默认标题
  return urlObj.hostname;
}

/**
 * 从 HTML 文档中提取 favicon
 */
function extractFavicon(doc: Document, urlObj: URL): string {
  // 1. 尝试获取 rel="icon" 或 rel="shortcut icon"
  const iconLink = doc.querySelector('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
  if (iconLink?.getAttribute("href")) {
    const href = iconLink.getAttribute("href")!;

    // 处理相对路径
    if (href.startsWith("/")) {
      return `${urlObj.origin}${href}`;
    }
    if (href.startsWith("http")) {
      return href;
    }
    return `${urlObj.origin}/${href}`;
  }

  // 2. 使用 Google Favicon 服务作为 fallback
  return getGoogleFavicon(urlObj.href);
}

/**
 * 使用 Google Favicon 服务获取图标
 */
export function getGoogleFavicon(url: string): string {
  try {
    const urlObj = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
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
