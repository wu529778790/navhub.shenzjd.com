/**
 * GitHub 存储管理器
 * 管理 GitHub 仓库的 fork、读写操作
 */

import { Octokit } from "@octokit/rest";
import type { NavData } from "./local-storage";

// 你的 GitHub 仓库信息（硬编码）
const ORIGINAL_OWNER = "wu529778790";
const ORIGINAL_REPO = "navhub.shenzjd.com";
const DATA_FILE_PATH = "data/sites.json";

/**
 * 获取 Octokit 实例
 */
export async function getOctokit(token: string): Promise<Octokit> {
  return new Octokit({ auth: token });
}

/**
 * 检查并确保用户已 fork 仓库
 */
export async function ensureForked(token: string): Promise<void> {
  const octokit = await getOctokit(token);
  const login = await getUserName(token);

  try {
    // 检查是否已经 fork
    await octokit.repos.get({
      owner: login,
      repo: ORIGINAL_REPO,
    });
    return;
  } catch (error: unknown) {
    if ((error as { status?: number })?.status === 404) {
      // 未 fork，创建 fork
      try {
        await octokit.repos.createFork({
          owner: ORIGINAL_OWNER,
          repo: ORIGINAL_REPO,
        });
        // 等待 fork 完成
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (forkError: unknown) {
        if ((forkError as { status?: number; message?: string })?.status === 403 &&
            (forkError as { message?: string })?.message?.includes("already being forked")) {
          // 正在 fork 中，等待
          await new Promise((resolve) => setTimeout(resolve, 2000));
          // 重新检查
          try {
            await octokit.repos.get({
              owner: login,
              repo: ORIGINAL_REPO,
            });
            return;
          } catch {
            throw new Error("Fork 失败");
          }
        }
        throw new Error("创建 Fork 失败");
      }
    } else {
      throw error;
    }
  }
}

/**
 * 读取数据文件（已登录用户 - 读取自己的仓库）
 */
export async function getDataFromGitHub(token: string): Promise<NavData | null> {
  try {
    const octokit = await getOctokit(token);
    const login = await getUserName(token);

    const response = await octokit.repos.getContent({
      owner: login,
      repo: ORIGINAL_REPO,
      path: DATA_FILE_PATH,
    });

    if ("content" in response.data) {
      const content = Buffer.from(response.data.content, "base64").toString("utf-8");
      return JSON.parse(content);
    }

    return null;
  } catch (error) {
    console.error("读取 GitHub 数据失败:", error);
    return null;
  }
}

/**
 * 读取你的仓库数据（访客模式 - 无需 token）
 */
export async function getYourDataFromGitHub(): Promise<NavData | null> {
  try {
    // 优先使用 raw.githubusercontent.com（更稳定，无 API 限流）
    const rawUrl = `https://raw.githubusercontent.com/${ORIGINAL_OWNER}/${ORIGINAL_REPO}/main/${DATA_FILE_PATH}`;

    const response = await fetch(rawUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NavHub-App',
      },
    });

    if (!response.ok) {
      console.error("GitHub Raw 请求失败:", response.status, response.statusText);

      // Fallback: 尝试使用 GitHub API
      console.log("尝试使用 GitHub API 作为 fallback...");
      const apiResponse = await fetch(
        `https://api.github.com/repos/${ORIGINAL_OWNER}/${ORIGINAL_REPO}/contents/${DATA_FILE_PATH}`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            'User-Agent': 'NavHub-App',
          },
        }
      );

      if (!apiResponse.ok) {
        console.error("GitHub API 请求也失败:", apiResponse.status, apiResponse.statusText);
        return null;
      }

      const apiData = await apiResponse.json();
      if (apiData.content) {
        const content = atob(apiData.content.replace(/\n/g, ''));
        return JSON.parse(content);
      }
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("读取你的 GitHub 数据失败:", error);
    return null;
  }
}

/**
 * 保存数据到 GitHub
 */
export async function saveDataToGitHub(token: string, data: NavData, message?: string): Promise<void> {
  // 确保已 fork
  await ensureForked(token);

  try {
    const octokit = await getOctokit(token);
    const login = await getUserName(token);

    // 先获取当前文件的 sha（如果存在）
    let sha: string | undefined;
    try {
      const existing = await octokit.repos.getContent({
        owner: login,
        repo: ORIGINAL_REPO,
        path: DATA_FILE_PATH,
      });
      if ("sha" in existing.data) {
        sha = existing.data.sha;
      }
    } catch {
      // 文件不存在，sha 为 undefined
    }

    await octokit.repos.createOrUpdateFileContents({
      owner: login,
      repo: ORIGINAL_REPO,
      path: DATA_FILE_PATH,
      message: message || `[skip ci] Update ${DATA_FILE_PATH}`,
      content: Buffer.from(JSON.stringify(data, null, 2)).toString("base64"),
      sha,
    });
  } catch (error) {
    console.error("保存到 GitHub 失败:", error);
    throw new Error("同步到 GitHub 失败");
  }
}

/**
 * 获取用户名
 */
async function getUserName(token: string): Promise<string> {
  const octokit = await getOctokit(token);
  const { data } = await octokit.users.getAuthenticated();
  return data.login;
}
