import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateCSRFToken,
  verifyCSRFToken,
  checkRateLimit,
  cleanupRateLimit,
  validateRedirectURI,
  validateGitHubToken,
  verifyOAuthState,
} from "./security";

describe("security", () => {
  describe("generateCSRFToken", () => {
    it("should generate a 64 character hex string", () => {
      const token = generateCSRFToken();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it("should generate unique tokens", () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe("verifyCSRFToken", () => {
    it("should return true for matching tokens", () => {
      const token = generateCSRFToken();
      expect(verifyCSRFToken(token, token)).toBe(true);
    });

    it("should return false for non-matching tokens", () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      expect(verifyCSRFToken(token1, token2)).toBe(false);
    });

    it("should return false for empty tokens", () => {
      expect(verifyCSRFToken("", "abc")).toBe(false);
      expect(verifyCSRFToken("abc", "")).toBe(false);
      expect(verifyCSRFToken("", "")).toBe(false);
    });
  });

  describe("checkRateLimit", () => {
    beforeEach(() => {
      cleanupRateLimit();
    });

    it("should allow requests within limit", () => {
      const result = checkRateLimit("test-ip", 3, 60000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it("should block requests exceeding limit", () => {
      checkRateLimit("test-ip-2", 2, 60000);
      checkRateLimit("test-ip-2", 2, 60000);
      const result = checkRateLimit("test-ip-2", 2, 60000);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should reset after window expires", () => {
      const now = Date.now();
      vi.useFakeTimers();
      vi.setSystemTime(now);

      checkRateLimit("test-ip-3", 1, 1000);
      const blocked = checkRateLimit("test-ip-3", 1, 1000);
      expect(blocked.allowed).toBe(false);

      vi.advanceTimersByTime(1001);
      const allowed = checkRateLimit("test-ip-3", 1, 1000);
      expect(allowed.allowed).toBe(true);

      vi.useRealTimers();
    });

    it("should track different identifiers separately", () => {
      checkRateLimit("ip-a", 1, 60000);
      const resultB = checkRateLimit("ip-b", 1, 60000);
      expect(resultB.allowed).toBe(true);
    });
  });

  describe("cleanupRateLimit", () => {
    it("should remove expired entries", () => {
      const now = Date.now();
      vi.useFakeTimers();
      vi.setSystemTime(now);

      checkRateLimit("expired-ip", 10, 1000);
      vi.advanceTimersByTime(1001);
      cleanupRateLimit();

      const result = checkRateLimit("expired-ip", 10, 1000);
      expect(result.remaining).toBe(9);

      vi.useRealTimers();
    });
  });

  describe("validateRedirectURI", () => {
    it("should accept valid redirect URIs", () => {
      const allowed = ["https://example.com", "http://localhost:3000"];
      expect(validateRedirectURI("https://example.com/callback", allowed)).toBe(true);
      expect(validateRedirectURI("http://localhost:3000/auth", allowed)).toBe(true);
    });

    it("should reject invalid redirect URIs", () => {
      const allowed = ["https://example.com"];
      expect(validateRedirectURI("https://evil.com/steal", allowed)).toBe(false);
      expect(validateRedirectURI("javascript:alert(1)", allowed)).toBe(false);
    });

    it("should handle malformed URLs", () => {
      expect(validateRedirectURI("not-a-url", ["https://example.com"])).toBe(false);
    });
  });

  describe("validateGitHubToken", () => {
    it("should accept valid GitHub tokens", () => {
      expect(validateGitHubToken("ghp_" + "a".repeat(36))).toBe(true);
      expect(validateGitHubToken("gho_" + "b".repeat(36))).toBe(true);
      expect(validateGitHubToken("ghu_" + "c".repeat(36))).toBe(true);
      expect(validateGitHubToken("ghs_" + "d".repeat(36))).toBe(true);
      expect(validateGitHubToken("a".repeat(40))).toBe(true);
    });

    it("should reject invalid tokens", () => {
      expect(validateGitHubToken("")).toBe(false);
      expect(validateGitHubToken("invalid")).toBe(false);
      expect(validateGitHubToken("ghp_short")).toBe(false);
      expect(validateGitHubToken("x".repeat(40))).toBe(false);
    });
  });

  describe("verifyOAuthState", () => {
    it("should return true for matching states", () => {
      const state = generateCSRFToken();
      expect(verifyOAuthState(state, state)).toBe(true);
    });

    it("should return false for non-matching states", () => {
      expect(verifyOAuthState("state1", "state2")).toBe(false);
    });

    it("should return false for empty states", () => {
      expect(verifyOAuthState("", "abc")).toBe(false);
      expect(verifyOAuthState("abc", "")).toBe(false);
    });
  });
});
