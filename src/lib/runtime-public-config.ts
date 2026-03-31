export interface RuntimePublicConfig {
  githubClientId: string;
  githubOwner: string;
  githubRepo: string;
  dataFilePath: string;
}

export function buildRuntimePublicConfig(env: Record<string, string | undefined>): RuntimePublicConfig {
  return {
    githubClientId: env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "",
    githubOwner: env.NEXT_PUBLIC_GITHUB_OWNER || "wu529778790",
    githubRepo: env.NEXT_PUBLIC_GITHUB_REPO || "navhub.shenzjd.com",
    dataFilePath: env.NEXT_PUBLIC_DATA_FILE_PATH || "data/sites.json",
  };
}

export function getServerRuntimePublicConfig(): RuntimePublicConfig {
  return buildRuntimePublicConfig(process.env);
}

let runtimeConfigCache: RuntimePublicConfig | null = null;
let runtimeConfigPromise: Promise<RuntimePublicConfig> | null = null;

export async function getRuntimePublicConfig(): Promise<RuntimePublicConfig> {
  if (typeof window === "undefined") {
    return getServerRuntimePublicConfig();
  }

  if (runtimeConfigCache) {
    return runtimeConfigCache;
  }

  if (!runtimeConfigPromise) {
    runtimeConfigPromise = fetch("/api/runtime-config", {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("获取运行时配置失败");
        }

        return (await response.json()) as RuntimePublicConfig;
      })
      .then((config) => {
        runtimeConfigCache = config;
        return config;
      })
      .finally(() => {
        runtimeConfigPromise = null;
      });
  }

  return runtimeConfigPromise;
}
