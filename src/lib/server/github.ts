import { Octokit } from "@octokit/rest";
import { cookies } from "next/headers";
import { GITHUB_CONFIG, SYNC_CONFIG } from "@/lib/config";

const ORIGINAL_OWNER = GITHUB_CONFIG.ORIGINAL_OWNER;
const ORIGINAL_REPO = GITHUB_CONFIG.ORIGINAL_REPO;
const DATA_FILE_PATH = GITHUB_CONFIG.DATA_FILE_PATH;

export interface GitHubUser {
  id: string;
  login: string;
  name: string;
  avatar: string;
}

/**
 * 自定义错误：数据仓库尚未 fork。
 *
 * GET /api/github/data 在检测到 404 时抛出这个错误，而不是无声返回 null，
 * 让 route handler 能明确告诉前端「用户 fork 不存在」这一语义，
 * 避免 fork 仓库为空和 fork 不存在两种情况被混淆成 data:null。
 */
export class ForkNotCreatedError extends Error {
  status = 404;
  constructor(message = "fork-not-created") {
    super(message);
    this.name = "ForkNotCreatedError";
  }
}

export async function getTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("github_token")?.value ?? null;
}

export async function getOctokitFromCookie(): Promise<Octokit> {
  const token = await getTokenFromCookie();
  if (!token) {
    throw new Error("未认证用户");
  }
  return new Octokit({ auth: token });
}

export async function getAuthenticatedUserFromCookie(): Promise<GitHubUser> {
  const cookieStore = await cookies();
  const encodedUser = cookieStore.get("github_user")?.value;

  if (encodedUser) {
    try {
      const user = JSON.parse(
        Buffer.from(encodedUser, "base64url").toString("utf-8")
      ) as GitHubUser;
      if (user.id && user.name && user.avatar) {
        return user;
      }
    } catch {
      // ignore malformed cookie and fallback to GitHub API
    }
  }

  const octokit = await getOctokitFromCookie();
  const { data } = await octokit.users.getAuthenticated();
  return {
    id: String(data.id),
    login: String(data.login),
    name: String(data.name || data.login),
    avatar: String(data.avatar_url),
  };
}

/**
 * 获取当前已认证用户的 GitHub login。
 *
 * 优化（避免双重 GitHub API 调用）：
 * 优先从 `github_user` cookie 中解码 `login` 字段。
 * 这个 cookie 在 OAuth callback 中由 server route 设置了完整的 user 信息。
 *
 * 仅在 cookie 不存在或无 login 字段时（罕见的过期 / 老会话）才会调 GitHub API。
 */
export async function getAuthenticatedLoginFromCookie(): Promise<string> {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("github_user")?.value;
  if (userCookie) {
    try {
      const decoded = JSON.parse(Buffer.from(userCookie, "base64url").toString("utf-8")) as {
        id?: string;
        login?: string;
        name?: string;
      };
      if (decoded.login) return decoded.login;
    } catch {
      // malformed → fallback to API
    }
  }

  const octokit = await getOctokitFromCookie();
  const { data } = await octokit.users.getAuthenticated();
  return data.login;
}

export async function ensureForkedFromCookie(): Promise<void> {
  const octokit = await getOctokitFromCookie();
  const login = await getAuthenticatedLoginFromCookie();

  try {
    await octokit.repos.get({
      owner: login,
      repo: ORIGINAL_REPO,
    });
    return;
  } catch {
    await octokit.repos.createFork({
      owner: ORIGINAL_OWNER,
      repo: ORIGINAL_REPO,
    });
    await new Promise((resolve) => setTimeout(resolve, SYNC_CONFIG.FORK_WAIT_MS));
  }
}

export async function getDataFromGitHubByCookie<T>(): Promise<T | null> {
  const octokit = await getOctokitFromCookie();
  const login = await getAuthenticatedLoginFromCookie();

  try {
    const response = await octokit.repos.getContent({
      owner: login,
      repo: ORIGINAL_REPO,
      path: DATA_FILE_PATH,
    });

    if (!("content" in response.data)) {
      return null;
    }

    const content = Buffer.from(response.data.content, "base64").toString("utf-8");
    return JSON.parse(content) as T;
  } catch (error) {
    // 404 分两种情况：
    // (a) fork 仓库不存在 → 抛 ForkNotCreatedError，让前端知道应该展示 "fork 提示"
    // (b) fork 仓库存在但 data/sites.json 文件不存在 → 抛 404 让前端感知道远程还是空的
    const status = (error as { status?: number }).status;
    if (status === 404) {
      throw new ForkNotCreatedError();
    }
    throw error;
  }
}

export async function saveDataToGitHubByCookie<T>(data: T, message?: string): Promise<void> {
  await ensureForkedFromCookie();

  const octokit = await getOctokitFromCookie();
  const login = await getAuthenticatedLoginFromCookie();

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
    // file not found, create new
  }

  await octokit.repos.createOrUpdateFileContents({
    owner: login,
    repo: ORIGINAL_REPO,
    path: DATA_FILE_PATH,
    message: message || `[skip ci] Update ${DATA_FILE_PATH}`,
    content: Buffer.from(JSON.stringify(data, null, 2)).toString("base64"),
    sha,
  });
}
