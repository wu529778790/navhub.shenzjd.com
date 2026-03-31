import { describe, expect, it } from "vitest";
import { getRenderableFaviconUrl } from "./favicon-url";

describe("getRenderableFaviconUrl", () => {
  it("将 DuckDuckGo favicon 地址转换为 Google S2，减少 404", () => {
    expect(getRenderableFaviconUrl("https://icons.duckduckgo.com/ip3/www.toolnb.com.ico")).toBe(
      "https://www.google.com/s2/favicons?domain=www.toolnb.com&sz=64"
    );
  });

  it("将 http 图标地址升级为 https", () => {
    expect(getRenderableFaviconUrl("http://www.alloyteam.com/favicon.ico")).toBe(
      "https://www.alloyteam.com/favicon.ico"
    );
  });

  it("保留正常的 https 图标地址", () => {
    expect(getRenderableFaviconUrl("https://github.com/fluidicon.png")).toBe(
      "https://github.com/fluidicon.png"
    );
  });

  it("空值时返回 undefined", () => {
    expect(getRenderableFaviconUrl("")).toBeUndefined();
    expect(getRenderableFaviconUrl(undefined)).toBeUndefined();
  });
});
