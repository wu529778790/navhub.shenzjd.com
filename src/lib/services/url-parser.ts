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

    // 尝试多种代理服务获取 HTML（绕过 CORS）
    const html = await fetchHTMLWithFallbacks(url);

    if (!html) {
      throw new Error("无法获取网页内容");
    }

    // 解析 HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

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
      favicon: getFaviconFallback(url),
    };
  }
}

/**
 * 使用多种代理服务尝试获取 HTML
 */
async function fetchHTMLWithFallbacks(url: string): Promise<string | null> {
  const enc = encodeURIComponent(url);

  // 代理服务列表
  const proxies = [
    // 1. allorigins.win
    `https://api.allorigins.win/get?url=${enc}`,
    // 2. isomorphic-git.org 的 CORS 代理
    `https://cors.isomorphic-git.org/${url}`,
    // 3. thingproxy (支持 WebSocket)
    `https://thingproxy.freeboard.io/fetch/${url}`,
  ];

  for (const proxyUrl of proxies) {
    try {
      const response = await fetch(proxyUrl, {
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        // 不同代理返回格式不同
        const data = await response.json();

        // allorigins.win 返回 { contents: "html" }
        if (data.contents) {
          return data.contents;
        }

        // 其他可能直接返回文本
        if (typeof data === 'string') {
          return data;
        }
      }
    } catch (e) {
      // 继续尝试下一个代理
      continue;
    }
  }

  return null;
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

  // 2. 使用 fallback
  return getFaviconFallback(urlObj.href);
}

/**
 * Favicon 降级方案（多种选择）
 */
export function getFaviconFallback(url: string): string {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    // 方案 1: DuckDuckGo Favicon 服务（推荐，无需登录）
    // https://duckduckgo.com/favicon.ico?domain=example.com
    return `https://duckduckgo.com/favicon.ico?domain=${domain}`;

    // 方案 2: Google Favicon（备用）
    // return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

    // 方案 3: Favicon Kit（备用）
    // return `https://faviconkit.com/${domain}/64`;

    // 方案 4: 直接访问网站 favicon（备用）
    // return `${urlObj.origin}/favicon.ico`;
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
