/**
 * 首屏概览区(Hero)
 * - 问候语(按时段)+ 价值文案
 * - 分类数 / 站点数 统计
 */

"use client";

import { useSyncExternalStore } from "react";
import { useSites } from "@/contexts/SitesContext";
import type { Category } from "@/lib/storage/local-storage";

interface OverviewBarProps {
  categories: Category[];
}

function getGreeting(hour: number): string {
  if (hour < 6) return "夜深了";
  if (hour < 12) return "早上好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
}

// 用 useSyncExternalStore 读取客户端时间,避免 SSR/CSR 时区差异导致的 hydration mismatch,
// 也避免在 effect 中 setState。
const subscribeTime = () => () => {};
const getClientGreeting = () => getGreeting(new Date().getHours());
const getServerGreeting = () => "";

export function OverviewBar({ categories }: OverviewBarProps) {
  const { isGuestMode } = useSites();
  const greeting = useSyncExternalStore(subscribeTime, getClientGreeting, getServerGreeting);

  const siteCount = categories.reduce((sum, c) => sum + c.sites.length, 0);
  const catCount = categories.length;

  return (
    <section className="mb-6">
      <div className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-[var(--shadow-sm)] sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)] sm:text-2xl">
            {greeting || "你好"}
            {isGuestMode ? ",访客" : ""}
          </h2>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
            {isGuestMode
              ? "正在浏览示例导航,登录 GitHub 后即可管理你的专属书签"
              : "管理你的专属导航,数据自动双向同步至 GitHub"}
          </p>
        </div>
        <div className="flex flex-shrink-0 gap-3">
          <Stat label="分类" value={catCount} />
          <Stat label="站点" value={siteCount} />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-[72px] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-center">
      <div className="text-xl font-bold tabular-nums text-[var(--primary-700)]">{value}</div>
      <div className="text-xs text-[var(--muted-foreground)]">{label}</div>
    </div>
  );
}
