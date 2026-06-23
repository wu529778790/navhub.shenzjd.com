import { describe, it, expect } from "vitest";
import {
  urlSchema,
  siteTitleSchema,
  faviconUrlSchema,
  categoryNameSchema,
  escapeHtml,
  sanitizeInput,
  validateAndSanitizeUrl,
  siteSchema,
  categorySchema,
} from "./validation";

describe("validation", () => {
  describe("urlSchema", () => {
    it("should accept valid HTTP/HTTPS URLs", () => {
      expect(urlSchema.parse("https://example.com")).toBe("https://example.com");
      expect(urlSchema.parse("http://localhost:3000")).toBe("http://localhost:3000");
      expect(urlSchema.parse("https://sub.domain.com/path?query=1")).toBe(
        "https://sub.domain.com/path?query=1"
      );
    });

    it("should reject empty URLs", () => {
      expect(() => urlSchema.parse("")).toThrow("URL 不能为空");
    });

    it("should reject invalid URLs", () => {
      expect(() => urlSchema.parse("not-a-url")).toThrow("请输入有效的 URL");
    });

    it("should reject javascript: protocol", () => {
      expect(() => urlSchema.parse("javascript:alert(1)")).toThrow("不允许使用 javascript: 协议");
    });

    it("should reject data: protocol", () => {
      expect(() => urlSchema.parse("data:text/html,<h1>test</h1>")).toThrow(
        "不允许使用 data: 协议"
      );
    });

    it("should reject non-http protocols", () => {
      expect(() => urlSchema.parse("ftp://example.com")).toThrow("只支持 http 和 https 协议");
    });
  });

  describe("siteTitleSchema", () => {
    it("should accept valid titles", () => {
      expect(siteTitleSchema.parse("My Website")).toBe("My Website");
      expect(siteTitleSchema.parse("测试站点")).toBe("测试站点");
    });

    it("should reject empty titles", () => {
      expect(() => siteTitleSchema.parse("")).toThrow("标题不能为空");
    });

    it("should reject titles over 200 characters", () => {
      expect(() => siteTitleSchema.parse("a".repeat(201))).toThrow("标题不能超过 200 个字符");
    });

    it("should reject XSS patterns", () => {
      expect(() => siteTitleSchema.parse('<script>alert("xss")</script>')).toThrow(
        "标题包含不安全的内容"
      );
      expect(() => siteTitleSchema.parse("javascript:void(0)")).toThrow(
        "标题包含不安全的内容"
      );
      expect(() => siteTitleSchema.parse('onclick=alert("xss")')).toThrow(
        "标题包含不安全的内容"
      );
      expect(() => siteTitleSchema.parse("<iframe src=evil></iframe>")).toThrow(
        "标题包含不安全的内容"
      );
    });
  });

  describe("faviconUrlSchema", () => {
    it("should accept valid URLs", () => {
      expect(faviconUrlSchema.parse("https://example.com/favicon.ico")).toBe(
        "https://example.com/favicon.ico"
      );
    });

    it("should accept data: URLs for base64 images", () => {
      expect(faviconUrlSchema.parse("data:image/png;base64,abc")).toBe(
        "data:image/png;base64,abc"
      );
    });

    it("should accept empty string", () => {
      expect(faviconUrlSchema.parse("")).toBe("");
    });

    it("should accept undefined", () => {
      expect(faviconUrlSchema.parse(undefined)).toBeUndefined();
    });

    it("should reject invalid URLs", () => {
      expect(() => faviconUrlSchema.parse("not-a-url")).toThrow();
    });
  });

  describe("categoryNameSchema", () => {
    it("should accept valid names", () => {
      expect(categoryNameSchema.parse("开发工具")).toBe("开发工具");
      expect(categoryNameSchema.parse("Dev Tools")).toBe("Dev Tools");
    });

    it("should reject empty names", () => {
      expect(() => categoryNameSchema.parse("")).toThrow("分类名称不能为空");
    });

    it("should reject names over 50 characters", () => {
      expect(() => categoryNameSchema.parse("a".repeat(51))).toThrow(
        "分类名称不能超过 50 个字符"
      );
    });

    it("should reject XSS patterns", () => {
      expect(() => categoryNameSchema.parse('<script>alert("xss")</script>')).toThrow(
        "分类名称包含不安全的内容"
      );
    });
  });

  describe("escapeHtml", () => {
    it("should escape HTML special characters", () => {
      expect(escapeHtml('<div class="test">')).toBe("&lt;div class=&quot;test&quot;&gt;");
      expect(escapeHtml("it's a test")).toBe("it&#039;s a test");
      expect(escapeHtml("a & b")).toBe("a &amp; b");
    });

    it("should handle empty string", () => {
      expect(escapeHtml("")).toBe("");
    });

    it("should handle string without special characters", () => {
      expect(escapeHtml("hello world")).toBe("hello world");
    });
  });

  describe("sanitizeInput", () => {
    it("should remove script tags", () => {
      expect(sanitizeInput('<script>alert("xss")</script>safe')).toBe("safe");
    });

    it("should remove javascript: protocol", () => {
      expect(sanitizeInput("javascript:alert(1)")).toBe("alert(1)");
    });

    it("should remove event handlers", () => {
      expect(sanitizeInput('onclick=alert("xss")')).toBe('alert("xss")');
    });

    it("should trim whitespace", () => {
      expect(sanitizeInput("  hello  ")).toBe("hello");
    });

    it("should handle normal text", () => {
      expect(sanitizeInput("Hello World")).toBe("Hello World");
    });
  });

  describe("validateAndSanitizeUrl", () => {
    it("should return clean URL", () => {
      expect(validateAndSanitizeUrl("https://example.com")).toBe("https://example.com/");
    });

    it("should remove javascript: from query params", () => {
      const result = validateAndSanitizeUrl("https://example.com?redirect=javascript:alert(1)");
      expect(result).not.toContain("javascript:");
    });

    it("should throw on invalid URL", () => {
      expect(() => validateAndSanitizeUrl("not-a-url")).toThrow();
    });

    it("should throw on javascript: protocol", () => {
      expect(() => validateAndSanitizeUrl("javascript:alert(1)")).toThrow();
    });
  });

  describe("siteSchema", () => {
    it("should accept valid site data", () => {
      const site = {
        id: "site-1",
        title: "My Site",
        url: "https://example.com",
      };
      expect(siteSchema.parse(site)).toEqual(site);
    });

    it("should accept site with optional fields", () => {
      const site = {
        id: "site-1",
        title: "My Site",
        url: "https://example.com",
        favicon: "https://example.com/favicon.ico",
        description: "A test site",
        sort: 0,
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      };
      expect(siteSchema.parse(site)).toEqual(site);
    });

    it("should reject site without required fields", () => {
      expect(() => siteSchema.parse({})).toThrow();
      expect(() => siteSchema.parse({ id: "1" })).toThrow();
    });
  });

  describe("categorySchema", () => {
    it("should accept valid category data", () => {
      const category = {
        id: "cat-1",
        name: "Development",
        sort: 0,
        sites: [],
      };
      expect(categorySchema.parse(category)).toEqual(category);
    });

    it("should accept category with sites", () => {
      const category = {
        id: "cat-1",
        name: "Development",
        sort: 0,
        sites: [
          {
            id: "site-1",
            title: "GitHub",
            url: "https://github.com",
          },
        ],
      };
      expect(categorySchema.parse(category)).toEqual(category);
    });

    it("should use default empty array for sites", () => {
      const category = {
        id: "cat-1",
        name: "Development",
        sort: 0,
      };
      expect(categorySchema.parse(category)).toEqual({ ...category, sites: [] });
    });

    it("should reject category without required fields", () => {
      expect(() => categorySchema.parse({})).toThrow();
    });
  });
});
