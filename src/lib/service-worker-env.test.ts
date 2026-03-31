import { describe, expect, it } from "vitest";
import { shouldEnableServiceWorker } from "./service-worker-env";

describe("shouldEnableServiceWorker", () => {
  it("在 development 环境禁用 service worker", () => {
    expect(shouldEnableServiceWorker("localhost", "development")).toBe(false);
    expect(shouldEnableServiceWorker("navhub.shenzjd.com", "development")).toBe(false);
  });

  it("在 localhost 上禁用 service worker", () => {
    expect(shouldEnableServiceWorker("localhost", "production")).toBe(false);
    expect(shouldEnableServiceWorker("127.0.0.1", "production")).toBe(false);
  });

  it("在生产环境的正式域名启用 service worker", () => {
    expect(shouldEnableServiceWorker("navhub.shenzjd.com", "production")).toBe(true);
  });
});
