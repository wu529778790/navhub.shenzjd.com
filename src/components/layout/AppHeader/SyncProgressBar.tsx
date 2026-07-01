/**
 * 同步进度条
 * 显示当前同步操作的进度信息
 */

"use client";

import { RefreshCw } from "lucide-react";
import type { SyncStepInfo } from "@/types";

interface SyncProgressBarProps {
  /** 同步步骤信息 */
  step: SyncStepInfo | null;
}

export function SyncProgressBar({ step }: SyncProgressBarProps) {
  if (!step) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-50 border-b border-[var(--border)] bg-[var(--background-secondary)]/95 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-[var(--primary-600)]" />
          <div className="flex-1">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--foreground)]">{step.label}</span>
              <span className="text-xs text-[var(--muted-foreground)]">{step.progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--muted)]">
              <div
                className="h-full bg-gradient-to-r from-[var(--primary-500)] to-[var(--accent-500)] transition-all duration-300"
                style={{ width: `${step.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
