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
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <FolderPlus className="h-6 w-6 text-[var(--primary-600)]" />
            添加分类
          </DialogTitle>
          <DialogDescription className="text-[var(--foreground-secondary)] text-sm">
            创建一个新的分类来组织你的链接
          </DialogDescription>
        </DialogHeader>

        <div className="py-5 space-y-4">
          {/* 输入框容器 - 玻璃拟态设计 */}
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
                "h-12 text-base rounded-[var(--radius-xl)] pl-11 pr-11",
                "bg-[var(--background)]/80 backdrop-blur-sm",
                "border-[var(--border)] hover:border-[var(--primary-400)]",
                "focus:border-[var(--primary-500)] focus:ring-2 focus:ring-[var(--primary-500)]/20",
                "transition-all duration-200"
              )}
            />
            {/* 左侧图标 */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
              <Folder className="h-4 w-4" />
            </div>
            {/* 右侧清除/状态按钮 */}
            {name && (
              <button
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2",
                  "p-1 rounded-[var(--radius-md)]",
                  "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
                  "hover:bg-[var(--muted)] transition-all duration-200",
                  "active:scale-90"
                )}
                onClick={() => setName("")}
                type="button"
                title="清空"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* 快捷提示 */}
          <div className="text-xs text-[var(--muted-foreground)] flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <span className="kbd">Enter</span> 确认
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="kbd">Esc</span> 取消
            </span>
          </div>
        </div>

        {/* 底部按钮栏 - 现代化设计 */}
        <div className="flex gap-2 pt-2 border-t border-[var(--border)]">
          <Button
            variant="outline"
            onClick={onClose}
            className={cn(
              "flex-1 h-11 rounded-[var(--radius-lg)]",
              "border-[var(--border)] hover:border-[var(--border-strong)]",
              "hover:bg-[var(--background-secondary)]",
              "transition-all duration-200 active:scale-95"
            )}
          >
            <X className="h-4 w-4 mr-2" />
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!name.trim()}
            className={cn(
              "flex-1 h-11 rounded-[var(--radius-lg)]",
              "bg-gradient-to-r from-[var(--primary-600)] to-[var(--primary-500)]",
              "hover:from-[var(--primary-700)] hover:to-[var(--primary-600)]",
              "text-white font-medium shadow-lg shadow-[var(--primary-500)]/20",
              "transition-all duration-200 active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
              !name.trim() && "opacity-50 cursor-not-allowed"
            )}
          >
            <Check className="h-4 w-4 mr-2" />
            确认
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}