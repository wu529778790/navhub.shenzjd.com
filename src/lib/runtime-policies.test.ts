import { describe, expect, it } from "vitest";
import {
  APP_SHELL_URL,
  buildContentSecurityPolicy,
  normalizeExternalAssetUrl,
  STATIC_CACHE_URLS,
} from "./runtime-policies";

describe("buildContentSecurityPolicy", () => {
  it("允许 Cloudflare Web Analytics 脚本和上报连接", () => {
    const csp = buildContentSecurityPolicy();

    expect(csp).toContain("https://static.cloudflareinsights.com");
    expect(csp).toContain("https://cloudflareinsights.com");
  });
});

describe("STATIC_CACHE_URLS", () => {
  it("只预缓存仓库中稳定存在的静态资源", () => {
    expect(STATIC_CACHE_URLS).toEqual(["/"]);
    expect(STATIC_CACHE_URLS).not.toContain("/offline");
    expect(STATIC_CACHE_URLS).not.toContain("/favicon.ico");
    expect(STATIC_CACHE_URLS).not.toContain("/manifest.json");
  });
});

describe("APP_SHELL_URL", () => {
  it("离线导航回退到已缓存的首页壳资源", () => {
    expect(APP_SHELL_URL).toBe("/");
  });
});

describe("normalizeExternalAssetUrl", () => {
  it("将 http 图标地址升级为 https", () => {
    expect(normalizeExternalAssetUrl("http://www.alloyteam.com/favicon.ico")).toBe(
      "https://www.alloyteam.com/favicon.ico"
    );
  });

  it("保留已经是 https 的地址", () => {
    expect(normalizeExternalAssetUrl("https://icons.duckduckgo.com/ip3/example.com.ico")).toBe(
      "https://icons.duckduckgo.com/ip3/example.com.ico"
    );
  });
});
