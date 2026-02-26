/**
 * Service Worker 更新横幅
 * 当有新版本可用时显示
 */

"use client";

import { useServiceWorker } from "@/hooks/use-service-worker";

export function UpdateBanner() {
  const { updateAvailable, applyUpdate } = useServiceWorker();

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-in slide-in-from-bottom">
      <div className="bg-gradient-to-r from-[var(--primary-600)] to-[var(--primary-700)] text-white rounded-lg shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">发现新版本</h3>
            <p className="text-xs text-white/80">
              点击更新按钮获取最新功能和修复
            </p>
          </div>
          <button
            onClick={applyUpdate}
            className="px-3 py-1.5 bg-white text-[var(--primary-700)] rounded-md text-sm font-medium hover:bg-white/90 transition-colors"
          >
            立即更新
          </button>
        </div>
      </div>
    </div>
  );
}
