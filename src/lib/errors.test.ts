/**
 * 错误处理模块测试
 */

import { describe, it, expect } from "vitest";
import {
  AuthError,
  NetworkError,
  RateLimitError,
  RepositoryError,
  GuestModeError,
  classifyError,
  getErrorMessage,
} from "./errors";

describe("错误类型", () => {
  describe("AuthError", () => {
    it("应该创建认证错误", () => {
      const error = new AuthError("Token 无效");
      expect(error.name).toBe("AuthError");
      expect(error.message).toBe("Token 无效");
      expect(error.statusCode).toBe(401);
    });

    it("应该使用默认消息", () => {
      const error = new AuthError();
      expect(error.message).toBe("认证失败，请重新登录");
    });
  });

  describe("NetworkError", () => {
    it("应该创建网络错误", () => {
      const error = new NetworkError("连接超时");
      expect(error.name).toBe("NetworkError");
      expect(error.message).toBe("连接超时");
    });

    it("应该使用默认消息", () => {
      const error = new NetworkError();
      expect(error.message).toBe("网络连接失败，请检查网络设置");
    });
  });

  describe("RateLimitError", () => {
    it("应该创建速率限制错误", () => {
      const error = new RateLimitError("请求过多", 60);
      expect(error.name).toBe("RateLimitError");
      expect(error.retryAfter).toBe(60);
    });
  });

  describe("RepositoryError", () => {
    it("应该创建仓库错误", () => {
      const error = new RepositoryError("仓库不存在", 404);
      expect(error.name).toBe("RepositoryError");
      expect(error.statusCode).toBe(404);
    });
  });

  describe("GuestModeError", () => {
    it("应该创建访客模式错误", () => {
      const error = new GuestModeError();
      expect(error.name).toBe("GuestModeError");
      expect(error.message).toContain("访客模式");
    });
  });
});

describe("classifyError", () => {
  it("应该识别认证错误", () => {
    const error = { status: 401, message: "Unauthorized" };
    const classified = classifyError(error);
    expect(classified).toBeInstanceOf(AuthError);
  });

  it("应该识别网络错误", () => {
    const error = new Error("fetch failed");
    const classified = classifyError(error);
    expect(classified).toBeInstanceOf(NetworkError);
  });

  it("应该识别速率限制错误", () => {
    const error = { status: 403, message: "API rate limit exceeded" };
    const classified = classifyError(error);
    expect(classified).toBeInstanceOf(RateLimitError);
  });

  it("应该识别仓库错误", () => {
    const error = { status: 404, message: "Not Found" };
    const classified = classifyError(error);
    expect(classified).toBeInstanceOf(RepositoryError);
  });

  it("应该返回原始错误类型", () => {
    const error = new AuthError("原始错误");
    const classified = classifyError(error);
    expect(classified).toBe(error);
  });
});

describe("getErrorMessage", () => {
  it("应该为 AuthError 返回带表情的消息", () => {
    const error = new AuthError("Token 失效");
    expect(getErrorMessage(error)).toMatch(/🔑.*Token 失效/);
  });

  it("应该为 NetworkError 返回带表情的消息", () => {
    const error = new NetworkError("网络错误");
    expect(getErrorMessage(error)).toMatch(/🌐.*网络错误/);
  });

  it("应该为 RateLimitError 返回带表情的消息", () => {
    const error = new RateLimitError();
    expect(getErrorMessage(error)).toMatch(/⏱️/);
  });

  it("应该为 RepositoryError 返回带表情的消息", () => {
    const error = new RepositoryError("仓库错误");
    expect(getErrorMessage(error)).toMatch(/📦.*仓库错误/);
  });

  it("应该为 GuestModeError 返回带表情的消息", () => {
    const error = new GuestModeError();
    expect(getErrorMessage(error)).toMatch(/👤.*访客模式/);
  });

  it("应该为普通错误返回带表情的消息", () => {
    const error = new Error("未知错误");
    expect(getErrorMessage(error)).toMatch(/❌.*未知错误/);
  });
});
