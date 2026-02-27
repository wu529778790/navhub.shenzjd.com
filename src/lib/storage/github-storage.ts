/**
 * GitHub 存储管理器（前端）
 * 通过内部 API 访问 GitHub，token 仅保存在 HttpOnly Cookie。
 */

import type { NavData } from "./local-storage";
import { GITHUB_CONFIG } from "@/lib/config";

const ORIGINAL_OWNER = GITHUB_CONFIG.ORIGINAL_OWNER;
const ORIGINAL_REPO = GITHUB_CONFIG.ORIGINAL_REPO;
const DATA_FILE_PATH = GITHUB_CONFIG.DATA_FILE_PATH;

export async function getDataFromGitHub(_token?: string): Promise<NavData | null> {
  void _token;
  const response = await fetch("/api/github/data", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });

  if (response.status === 401) {
    throw new Error("未认证用户");
  }
  if (!response.ok) {
    throw new Error("读取 GitHub 数据失败");
  }

  const payload = await response.json() as { data: NavData | null };
  return payload.data;
}

export async function saveDataToGitHub(_token: string, data: NavData, message?: string): Promise<void> {
  void _token;
  const response = await fetch("/api/github/data", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data, message }),
  });

  if (response.status === 401) {
    throw new Error("未认证用户");
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "保存到 GitHub 失败" })) as { error?: string };
    throw new Error(payload.error || "保存到 GitHub 失败");
  }
}

export async function getYourDataFromGitHub(): Promise<NavData | null> {
  try {
    const rawUrl = `https://raw.githubusercontent.com/${ORIGINAL_OWNER}/${ORIGINAL_REPO}/main/${DATA_FILE_PATH}`;
    const response = await fetch(rawUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "NavHub-App",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const apiResponse = await fetch(
        `https://api.github.com/repos/${ORIGINAL_OWNER}/${ORIGINAL_REPO}/contents/${DATA_FILE_PATH}`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "NavHub-App",
          },
          cache: "no-store",
        }
      );

      if (!apiResponse.ok) {
        return null;
      }

      const apiData = await apiResponse.json() as { content?: string };
      if (apiData.content) {
        const content = atob(apiData.content.replace(/\n/g, ""));
        return JSON.parse(content) as NavData;
      }
      return null;
    }

    return await response.json() as NavData;
  } catch (error) {
    console.error("读取你的 GitHub 数据失败:", error);
    return null;
  }
}
