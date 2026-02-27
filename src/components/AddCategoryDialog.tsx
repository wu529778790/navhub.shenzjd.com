/**
 * 添加分类对话框 - 现代化玻璃拟态设计
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FolderPlus, Folder, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddCategoryDialogProps {
  onClose: () => void;
  onConfirm: (name: string) => void;
}

export function AddCategoryDialog({ onClose, onConfirm }: AddCategoryDialogProps) {
  const [name, setName] = useState("");

  const handleConfirm = () => {
    if (!name.trim()) {
      return;
    }
    onConfirm(name);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <FolderPlus className="h-6 w-6 text-[var(--primary-700)]" />
            添加分类
          </DialogTitle>
          <DialogDescription className="text-sm text-[var(--foreground-secondary)]">
            创建一个新的分类来组织你的链接
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-5">
          <div className="relative">
            <Input
              placeholder="输入分类名称（如：工作、学习、娱乐）"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirm();
                if (e.key === "Escape") onClose();
              }}
              autoFocus
              className={cn(
                "h-12 rounded-[var(--radius-xl)] pl-11 pr-11 text-base",
                "bg-[var(--background-secondary)]/85 backdrop-blur-sm",
                "border-[var(--border)] hover:border-[var(--primary-400)]",
                "focus:border-[var(--primary-500)] focus:ring-2 focus:ring-[var(--primary-500)]/20",
                "transition-all duration-200"
              )}
            />

            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
              <Folder className="h-4 w-4" />
            </div>

            {name && (
              <button
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2",
                  "cursor-pointer rounded-[var(--radius-md)] p-1",
                  "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
                  "transition-all duration-200 active:scale-90"
                )}
                onClick={() => setName("")}
                type="button"
                title="清空"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <span className="inline-flex items-center gap-1">
              <span className="kbd">Enter</span> 确认
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="kbd">Esc</span> 取消
            </span>
          </div>
        </div>

        <div className="flex gap-2 border-t border-[var(--border)] pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className={cn(
              "h-11 flex-1 rounded-[var(--radius-lg)]",
              "border-[var(--border)] bg-[var(--background-secondary)]",
              "hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/50",
              "transition-all duration-200 active:scale-95"
            )}
          >
            <X className="mr-2 h-4 w-4" />
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!name.trim()}
            className={cn(
              "h-11 flex-1 rounded-[var(--radius-lg)]",
              "bg-gradient-to-r from-[var(--primary-600)] to-[var(--accent-600)]",
              "hover:from-[var(--primary-700)] hover:to-[var(--accent-500)]",
              "font-medium text-white shadow-[0_14px_24px_-14px_rgba(15,108,97,0.9)]",
              "transition-all duration-200 active:scale-95",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            )}
          >
            <Check className="mr-2 h-4 w-4" />
            确认
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
