/**
 * 本地存储测试
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  saveSitesToLocalStorage,
  getSitesFromLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
  type Category,
} from "../local-storage";

describe("local-storage", () => {
  beforeEach(() => {
    clearLocalStorage();
  });

  it("应该能够保存和读取站点数据", () => {
    const categories: Category[] = [
      {
        id: "cat1",
        name: "测试分类",
        sort: 0,
        sites: [
          {
            id: "site1",
            title: "测试站点",
            url: "https://example.com",
            favicon: "https://example.com/favicon.ico",
          },
        ],
      },
    ];

    saveSitesToLocalStorage(categories);
    const result = getSitesFromLocalStorage();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("cat1");
    expect(result[0].sites).toHaveLength(1);
    expect(result[0].sites[0].id).toBe("site1");
  });

  it("应该能够清除本地存储", () => {
    const categories: Category[] = [
      {
        id: "cat1",
        name: "测试分类",
        sort: 0,
        sites: [],
      },
    ];

    saveSitesToLocalStorage(categories);
    clearLocalStorage();
    const result = getSitesFromLocalStorage();

    expect(result).toHaveLength(0);
  });

  it("应该能够处理空数据", () => {
    const data = loadFromLocalStorage();
    expect(data).toBeNull();
  });
});
