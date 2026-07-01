/**
 * 离线状态提示横幅
 */

"use client";

interface OfflineBannerProps {
  /** 是否在线 */
  isOnline: boolean;
}

export function OfflineBanner({ isOnline }: OfflineBannerProps) {
  if (isOnline) return null;

  return (
    <div className="border-b border-warning/35 bg-warning/12 px-4 py-2 text-center text-sm text-[var(--foreground-secondary)]">
      ⚠️ 当前处于离线状态，数据将保存到本地，恢复网络后自动同步
    </div>
  );
}
