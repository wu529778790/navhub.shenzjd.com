"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { siteTitleSchema, urlSchema } from "@/lib/validation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface EditSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTitle: string;
  initialUrl: string;
  initialFavicon: string;
  onSave: (data: { title: string; url: string; favicon: string }) => Promise<void>;
}

export function EditSiteDialog({
  open,
  onOpenChange,
  initialTitle,
  initialUrl,
  initialFavicon,
  onSave,
}: EditSiteDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [url, setUrl] = useState(initialUrl);
  const [favicon, setFavicon] = useState(initialFavicon);
  const [isLoading, setIsLoading] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const isFormValid = title.trim().length > 0 && url.trim().length > 0 && !titleError && !urlError;

  const handleSave = async () => {
    const titleResult = siteTitleSchema.safeParse(title);
    const urlResult = urlSchema.safeParse(url);

    if (!titleResult.success) {
      setTitleError(titleResult.error.issues[0]?.message || "标题无效");
      return;
    }
    if (!urlResult.success) {
      setUrlError(urlResult.error.issues[0]?.message || "URL 无效");
      return;
    }

    try {
      setIsLoading(true);
      await onSave({ title, url, favicon });
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[var(--background)]/95 backdrop-blur-2xl border border-[var(--border)] rounded-[var(--radius-2xl)] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)] p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[var(--foreground)]">
            编辑站点
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--foreground-secondary)]">标题</label>
            <Input
              placeholder="站点名称"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setTitleError(null); }}
              disabled={isLoading}
              className={cn(
                "h-12 rounded-[var(--radius-lg)]",
                "bg-[var(--background)]/80 backdrop-blur-sm",
                "border-[var(--border)] hover:border-[var(--primary-400)]",
                "focus:border-[var(--primary-500)] focus:ring-2 focus:ring-[var(--primary-500)]/20"
              )}
            />
            {titleError && <p className="text-xs text-[var(--error)]">{titleError}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--foreground-secondary)]">URL</label>
            <Input
              placeholder="https://example.com"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setUrlError(null); }}
              disabled={isLoading}
              className={cn(
                "h-12 rounded-[var(--radius-lg)]",
                "bg-[var(--background)]/80 backdrop-blur-sm",
                "border-[var(--border)] hover:border-[var(--primary-400)]",
                "focus:border-[var(--primary-500)] focus:ring-2 focus:ring-[var(--primary-500)]/20"
              )}
            />
            {urlError && <p className="text-xs text-[var(--error)]">{urlError}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--foreground-secondary)]">
              图标 URL (可选)
            </label>
            <Input
              placeholder="https://example.com/favicon.ico"
              value={favicon}
              onChange={(e) => setFavicon(e.target.value)}
              disabled={isLoading}
              className={cn(
                "h-12 rounded-[var(--radius-lg)]",
                "bg-[var(--background)]/80 backdrop-blur-sm",
                "border-[var(--border)] hover:border-[var(--primary-400)]",
                "focus:border-[var(--primary-500)] focus:ring-2 focus:ring-[var(--primary-500)]/20"
              )}
            />
          </div>
        </div>
        <div className="flex gap-3 pt-4 mt-4 border-t border-[var(--border)] w-full">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className={cn(
              "flex-1 h-12 rounded-[var(--radius-xl)] text-base font-medium",
              "bg-[var(--background)] border border-[var(--border)]",
              "hover:bg-[var(--background-secondary)] hover:border-[var(--border-strong)]",
              "transition-all duration-200 active:scale-95"
            )}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button
            onClick={handleSave}
            className={cn(
              "flex-1 h-12 rounded-[var(--radius-xl)] text-base font-medium",
              "bg-gradient-to-r from-[var(--primary-600)] to-[var(--primary-500)]",
              "hover:from-[var(--primary-700)] hover:to-[var(--primary-600)]",
              "text-white font-medium shadow-lg shadow-[var(--primary-500)]/20",
              "transition-all duration-200 active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            )}
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? "保存中..." : "保存"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
