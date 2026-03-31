/**
 * Service Worker Hook
 * 注册和管理 Service Worker
 * 优化的更新策略：非阻塞式更新提示
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { shouldEnableServiceWorker } from "@/lib/service-worker-env";

export type SWUpdateStatus = "idle" | "checking" | "available" | "updating";

interface UseServiceWorkerReturn {
  updateStatus: SWUpdateStatus;
  updateAvailable: boolean;
  checkForUpdates: () => Promise<void>;
  applyUpdate: () => void;
}

/**
 * Service Worker Hook
 */
export function useServiceWorker(): UseServiceWorkerReturn {
  const [updateStatus, setUpdateStatus] = useState<SWUpdateStatus>("idle");
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const isCheckingRef = useRef(false);

  // 检查更新
  const checkForUpdates = useCallback(async () => {
    if (isCheckingRef.current || !registrationRef.current) {
      return;
    }

    isCheckingRef.current = true;
    setUpdateStatus("checking");

    try {
      await registrationRef.current.update();
      setUpdateStatus("idle");
    } catch (error) {
      console.error("[SW] Update check failed:", error);
      setUpdateStatus("idle");
    } finally {
      isCheckingRef.current = false;
    }
  }, []);

  // 应用更新
  const applyUpdate = useCallback(() => {
    if (!registrationRef.current || !registrationRef.current.waiting) {
      return;
    }

    setUpdateStatus("updating");

    // 通知等待中的 Service Worker 跳过等待
    registrationRef.current.waiting.postMessage({ type: "SKIP_WAITING" });

    // 页面会在 controllerchange 事件中自动刷新
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // 检查是否支持 Service Worker
    if (!("serviceWorker" in navigator)) {
      console.warn("[SW] Service Worker not supported");
      return;
    }

    if (!shouldEnableServiceWorker(window.location.hostname, process.env.NODE_ENV)) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      });
      return;
    }

    // 注册 Service Worker
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          updateViaCache: "imports", // 优化：仅通过缓存导入的资源
        });

        registrationRef.current = registration;
        console.log("[SW] Service Worker registered:", registration);

        // 检查是否有等待中的 Service Worker
        if (registration.waiting) {
          setUpdateAvailable(true);
          setUpdateStatus("available");
          console.log("[SW] Waiting service worker found");
        }

        // 监听新的 Service Worker 安装
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          console.log("[SW] New service worker installing");

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                // 有新版本可用
                console.log("[SW] New service worker available");
                setUpdateAvailable(true);
                setUpdateStatus("available");
              } else {
                // 首次安装
                console.log("[SW] Service worker installed for the first time");
                setUpdateStatus("idle");
              }
            }
          });
        });

        // 定期检查更新（每 30 分钟）
        const updateInterval = setInterval(() => {
          checkForUpdates();
        }, 30 * 60 * 1000);

        return () => {
          clearInterval(updateInterval);
        };
      } catch (error) {
        console.error("[SW] Service Worker registration failed:", error);
      }
    };

    // 等待页面加载完成后注册
    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
    }

    // 监听 Service Worker 控制权变化
    const handleControllerChange = () => {
      console.log("[SW] Service Worker controller changed, reloading...");
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, [checkForUpdates]);

  return {
    updateStatus,
    updateAvailable,
    checkForUpdates,
    applyUpdate,
  };
}

/**
 * 获取 Service Worker 注册实例（用于调试）
 */
export async function getSWRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    return registrations[0] || null;
  } catch {
    return null;
  }
}
