/**
 * Fork 确认对话框
 * 登录前显示仓库 Fork 提示
 */

"use client";

import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RuntimePublicConfig } from "@/types";

interface ForkConfirmDialogProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 确认登录回调 */
  onConfirm: () => void;
  /** 运行时配置 */
  runtimeConfig: RuntimePublicConfig | null;
}

export function ForkConfirmDialog({ open, onClose, onConfirm, runtimeConfig }: ForkConfirmDialogProps) {
  if (!open) return null;

  const githubOwner = runtimeConfig?.githubOwner || "wu529778790";
  const githubRepo = runtimeConfig?.githubRepo || "navhub.shenzjd.com";
  const dataFilePath = runtimeConfig?.dataFilePath || "data/sites.json";

  return (
    <div className="fade-in fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ background: 'var(--scrim)' }}>
      <div className="scale-in w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-[var(--shadow-lg)]" role="dialog" aria-modal="true" aria-labelledby="fork-dialog-title">
        <div className="mb-4 flex items-center gap-3">
          <Github className="h-6 w-6 text-[var(--primary-500)]" />
          <h3 id="fork-dialog-title" className="text-lg font-bold">登录确认</h3>
        </div>
        <div className="mb-6 space-y-3 text-sm text-[var(--foreground-secondary)]">
          <p>
            登录后，系统会自动 Fork 仓库
            <code className="ml-1 rounded bg-[var(--muted)] px-2 py-0.5">
              {githubOwner}/{githubRepo}
            </code>
            到你的 GitHub 账户。
          </p>
          <p>数据将存放在你的仓库中：</p>
          <ul className="ml-4 list-inside list-disc space-y-1">
            <li>
              文件路径:{" "}
              <code className="rounded bg-[var(--muted)] px-2 py-0.5">{dataFilePath}</code>
            </li>
            <li>
              仓库名称:{" "}
              <code className="rounded bg-[var(--muted)] px-2 py-0.5">{githubRepo}</code>
            </li>
          </ul>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="cursor-pointer">
            取消
          </Button>
          <Button onClick={onConfirm} className="cursor-pointer">
            继续登录
          </Button>
        </div>
      </div>
    </div>
  );
}
