const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export function shouldEnableServiceWorker(
  hostname: string,
  nodeEnv: string | undefined
): boolean {
  if (nodeEnv !== "production") {
    return false;
  }

  return !LOCAL_HOSTS.has(hostname);
}
