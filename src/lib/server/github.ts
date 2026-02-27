import { Octokit } from "@octokit/rest";
import { cookies } from "next/headers";
import { GITHUB_CONFIG, SYNC_CONFIG } from "@/lib/config";

const ORIGINAL_OWNER = GITHUB_CONFIG.ORIGINAL_OWNER;
const ORIGINAL_REPO = GITHUB_CONFIG.ORIGINAL_REPO;
const DATA_FILE_PATH = GITHUB_CONFIG.DATA_FILE_PATH;

export interface GitHubUser {
  id: string;
  name: string;
  avatar: string;
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
      const user = JSON.parse(Buffer.from(encodedUser, "base64url").toString("utf-8")) as GitHubUser;
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
    name: String(data.name || data.login),
    avatar: String(data.avatar_url),
  };
}

export async function getAuthenticatedLoginFromCookie(): Promise<string> {
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
