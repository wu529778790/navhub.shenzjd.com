/**
 * Service Worker 注册组件
 */

"use client";

import { useServiceWorker } from "@/hooks/use-service-worker";

export function ServiceWorkerRegister() {
  useServiceWorker();
  return null;
}
