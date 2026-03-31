import { describe, expect, it } from "vitest";
import { buildFaviconProxyUrl, getRenderableFaviconUrl } from "./favicon-url";

describe("buildFaviconProxyUrl", () => {
  it("为远程图标地址生成同源代理路径", () => {
    expect(buildFaviconProxyUrl("https://github.com/fluidicon.png")).toBe(
      "/api/favicon?src=https%3A%2F%2Fgithub.com%2Ffluidicon.png"
    );
  });

  it("对空值返回 undefined", () => {
    expect(buildFaviconProxyUrl("")).toBeUndefined();
    expect(buildFaviconProxyUrl(undefined)).toBeUndefined();
  });

  it("将协议相对 URL 规范化后再走代理", () => {
    expect(buildFaviconProxyUrl("//cdn.example.com/favicon.ico")).toBe(
      "/api/favicon?src=https%3A%2F%2Fcdn.example.com%2Ffavicon.ico"
    );
  });
});

describe("getRenderableFaviconUrl", () => {
  it("将 DuckDuckGo favicon 地址转换为 Google S2，减少 404", () => {
    expect(getRenderableFaviconUrl("https://icons.duckduckgo.com/ip3/www.toolnb.com.ico")).toBe(
      "/api/favicon?src=https%3A%2F%2Fwww.google.com%2Fs2%2Ffavicons%3Fdomain%3Dwww.toolnb.com%26sz%3D64"
    );
  });

  it("将 http 图标地址升级为 https", () => {
    expect(getRenderableFaviconUrl("http://www.alloyteam.com/favicon.ico")).toBe(
      "/api/favicon?src=https%3A%2F%2Fwww.alloyteam.com%2Ffavicon.ico"
    );
  });

  it("保留正常的 https 图标地址", () => {
    expect(getRenderableFaviconUrl("https://github.com/fluidicon.png")).toBe(
      "/api/favicon?src=https%3A%2F%2Fgithub.com%2Ffluidicon.png"
    );
  });

  it("空值时返回 undefined", () => {
    expect(getRenderableFaviconUrl("")).toBeUndefined();
    expect(getRenderableFaviconUrl(undefined)).toBeUndefined();
  });
});
