import { Octokit } from "@octokit/rest";
import { cookies } from "next/headers";
import { GITHUB_CONFIG } from "@/lib/config";

// fork 轮询 poll 参数——与 @/lib/config SYNC_CONFIG 保持同源，
// 直接内联避免循环依赖；修改时请两处同步维护。
const FORK_POLL_MAX_ATTEMPTS = 5;
const FORK_POLL_INITIAL_DELAY_MS = 1000;
const FORK_POLL_BACKOFF_FACTOR = 1.8;

//（SYNC_CONFIG.FORK_* 在 @/lib/config 同名维护）

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

/**
 * 带指数退避的 fork 存在性轮询。
 *
 * 返回 true 表示仓库可访问，false 表示超出重试次数（理论上不应发生，
 * GitHub 通常 <10s 内即可完成 fork）。
 */
async function pollForkReady(
  octokit: Octokit,
  login: string,
  maxAttempts: number = FORK_POLL_MAX_ATTEMPTS,
): Promise<boolean> {
  let delay = FORK_POLL_INITIAL_DELAY_MS;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    delay = Math.ceil(delay * FORK_POLL_BACKOFF_FACTOR);
    try {
      await octokit.repos.get({
        owner: login,
        repo: ORIGINAL_REPO,
      });
      return true;
    } catch (error) {
      const status = (error as { status?: number }).status;
      // 404 = 还在 fork 中/尚未可见；其他错误（403/500/网络）也继续重试
      if (status !== 404 && status !== undefined) {
        // 非 404 的错误（如 401/403/502）记录下来方便诊断
        console.info(
          `[fork] poll attempt ${attempt}/${maxAttempts}: status=${status}, retrying...`,
        );
      }
    }
  }
  return false;
}

/**
 * 确保当前认证用户已 fork 原仓库。
 *
 * 流程：
 * 1. 检查 fork 是否存在（GET /repos/{login}/{repo}）
 * 2. 已存在 → 立即返回
 * 3. 不存在 → POST createFork → 轮询等待 fork 真正可用（指数退避）
 * 4. createFork 失败（如 422 fork 已拥有但 getStatus 异常、403 限流）→ 抛带语义的错误
 */
export async function ensureForkedFromCookie(): Promise<void> {
  const octokit = await getOctokitFromCookie();
  const login = await getAuthenticatedLoginFromCookie();

  try {
    await octokit.repos.get({
      owner: login,
      repo: ORIGINAL_REPO,
    });
    return; // fork 已存在
  } catch {
    // 不存在 → 创建 fork
  }

  try {
    await octokit.repos.createFork({
      owner: ORIGINAL_OWNER,
      repo: ORIGINAL_REPO,
      // organization: — 个人场景不需要，留作未来组织账号扩展点
    });
  } catch (error) {
    const status = (error as { status?: number }).status;
    // 422 = 已经 fork 过（并发重入或最近刚创建）→ 继续轮询，不抛错
    if (status === 422) {
      console.info("[fork] createFork returned 422 (fork likely exists), continuing to poll");
    } else {
      const message =
        status === 403
          ? "GitHub 权限不足，无法创建 fork（可能触发速率限制或无权访问原仓库）"
          : status === 404
            ? "原仓库不存在，请确认 GITHUB 配置正确"
            : `创建 fork 失败 (status=${status ?? "unknown"})`;
      const wrapped = new Error(message) as Error & { status?: number };
      wrapped.status = status;
      wrapped.name = "ForkCreateError";
      throw wrapped;
    }
  }

  // fork 创建成功（或 422 重复创建）→ 轮询等待仓库可用
  const ready = await pollForkReady(octokit, login);
  if (!ready) {
    const msg = `fork 已提交但约 12s 内仍未就绪，请稍后在设置页点击"手动同步"重试`;
    const err = new Error(msg) as Error & { status?: number };
    err.status = 504;
    err.name = "ForkNotReadyError";
    throw err;
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
