/**
 * Service Worker Hook
 * 注册和管理 Service Worker
 */

"use client";

import { useEffect } from "react";

export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // 检查是否支持 Service Worker
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        const swUrl = `/sw.js`;

        navigator.serviceWorker
          .register(swUrl)
          .then((registration) => {
            console.log("[SW] Service Worker registered:", registration);

            // 监听更新
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                    // 有新版本可用
                    console.log("[SW] New service worker available");
                    if (confirm("发现新版本，是否立即更新？")) {
                      newWorker.postMessage({ type: "SKIP_WAITING" });
                    }
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error("[SW] Service Worker registration failed:", error);
          });
      });

      // 监听 Service Worker 控制权变化
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("[SW] Service Worker controller changed, reloading...");
        window.location.reload();
      });
    } else {
      console.warn("[SW] Service Worker not supported");
    }
  }, []);
}
