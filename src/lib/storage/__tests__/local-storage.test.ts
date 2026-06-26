/**
 * 本地存储测试
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  saveSitesToLocalStorage,
  getSitesFromLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
  isLocalDataValid,
  type Category,
  type NavData,
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

describe("isLocalDataValid", () => {
  it("null 视为无效", () => {
    expect(isLocalDataValid(null)).toBe(false);
  });

  it("无 categories 视为无效", () => {
    expect(isLocalDataValid({ version: "1.0", lastModified: 0, categories: [] })).toBe(false);
  });

  it("单个空的默认分类视为无效（原 bug 的回归保护）", () => {
    const data: NavData = {
      version: "1.0",
      lastModified: 0,
      categories: [{ id: "default", name: "默认分类", sort: 0, sites: [] }],
    };
    // 这是历史上「打开永远显示空」死循环的根因：空默认分类被当成有效数据
    expect(isLocalDataValid(data)).toBe(false);
  });

  it("有真实站点的默认分类视为有效", () => {
    const data: NavData = {
      version: "1.0",
      lastModified: Date.now(),
      categories: [
        {
          id: "default",
          name: "默认分类",
          sort: 0,
          sites: [{ id: "s1", title: "t", url: "https://example.com" }],
        },
      ],
    };
    expect(isLocalDataValid(data)).toBe(true);
  });

  it("单个非默认的空分类视为有效", () => {
    const data: NavData = {
      version: "1.0",
      lastModified: Date.now(),
      categories: [{ id: "custom", name: "自定义", sort: 0, sites: [] }],
    };
    // 用户主动建的空分类是真实意图，不应被当成兜底产物
    expect(isLocalDataValid(data)).toBe(true);
  });

  it("多个分类视为有效", () => {
    const data: NavData = {
      version: "1.0",
      lastModified: Date.now(),
      categories: [
        { id: "default", name: "默认", sort: 0, sites: [] },
        { id: "cat2", name: "分类2", sort: 1, sites: [] },
      ],
    };
    expect(isLocalDataValid(data)).toBe(true);
  });
});
