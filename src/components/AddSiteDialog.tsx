/**
 * 添加站点对话框 - 分步流程设计
 */

"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState, useCallback } from "react";
import { useSites } from "@/contexts/SitesContext";
import { parseURL } from "@/lib/services/url-parser";
import type { Site } from "@/lib/storage/local-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Clipboard,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  WandSparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FaviconImage } from "@/components/FaviconImage";
import { urlSchema, escapeHtml } from "@/lib/validation";

interface AddSiteDialogProps {
  activeCategory: string;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddSiteDialog({
  activeCategory,
  onSuccess,
  open,
  onOpenChange,
}: AddSiteDialogProps) {
  const { addSite } = useSites();
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [siteInfo, setSiteInfo] = useState<Site | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const currentStep = siteInfo ? 2 : 1;

  const resetToUrlStep = () => {
    setSiteInfo(null);
    setEditedTitle("");
    setError("");
    setShowSuccess(false);
  };

  const handleParse = useCallback(
    async (urlToCheck?: string) => {
      try {
        const urlToValidate = (urlToCheck || link).trim();
        urlSchema.parse(urlToValidate);

        setLoading(true);
        setError("");
        setIsSubmitting(false);

        const { title, favicon } = await parseURL(urlToValidate);

        setSiteInfo({
          id: crypto.randomUUID(),
          title,
          favicon,
          url: urlToValidate,
        });
        setEditedTitle(title);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 1600);
      } catch (err) {
        setSiteInfo({
          id: crypto.randomUUID(),
          title: "",
          favicon: "",
          url: (urlToCheck || link).trim(),
        });
        setEditedTitle("");
        setError(err instanceof Error ? err.message : "发生未知错误");
      } finally {
        setLoading(false);
        setIsSubmitting(false);
      }
    },
    [link]
  );

  useEffect(() => {
    if (!open) return;

    const checkClipboard = async () => {
      try {
        const text = await navigator.clipboard.readText();
        try {
          urlSchema.parse(text);
          setLink(text);
          handleParse(text);
        } catch {
          // ignore invalid clipboard content
        }
      } catch {
        // clipboard read can fail in unsupported contexts
      }
    };

    checkClipboard();
  }, [open, handleParse]);

  const handleConfirm = async () => {
    if (!siteInfo) return;

    try {
      setIsSubmitting(true);
      await addSite(activeCategory, {
        id: crypto.randomUUID(),
        title: editedTitle || siteInfo.title,
        favicon: siteInfo.favicon,
        url: siteInfo.url,
      });

      setLink("");
      setSiteInfo(null);
      setEditedTitle("");
      setError("");
      onOpenChange?.(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "添加站点失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-secondary)]/75 p-2 text-xs">
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1",
          currentStep === 1
            ? "bg-[var(--primary-100)] text-[var(--primary-700)]"
            : "text-[var(--muted-foreground)]"
        )}
      >
        <span className="kbd">1</span>
        <span>输入链接</span>
      </div>
      <span className="text-[var(--muted-foreground)]">→</span>
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1",
          currentStep === 2
            ? "bg-[var(--primary-100)] text-[var(--primary-700)]"
            : "text-[var(--muted-foreground)]"
        )}
      >
        <span className="kbd">2</span>
        <span>确认信息</span>
      </div>
    </div>
  );

  const renderUrlInputSection = () => (
    <div className="slide-up space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground-secondary)]">
        <WandSparkles className="h-4 w-4 text-[var(--accent-600)]" />
        粘贴链接后自动解析标题与图标
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="输入网站链接 (如: https://example.com)"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            disabled={loading}
            className={cn(
              "h-12 rounded-[var(--radius-lg)] pr-12 text-base",
              "bg-[var(--background-secondary)]/85 backdrop-blur-sm",
              loading && "opacity-70"
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter" && link.trim()) {
                e.preventDefault();
                handleParse();
              }
            }}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <button
              className={cn(
                "rounded-[var(--radius-md)] p-1.5",
                "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
                "transition-all duration-200 active:scale-95",
                loading && "cursor-not-allowed opacity-50"
              )}
              onClick={async () => {
                if (loading) return;
                try {
                  const text = await navigator.clipboard.readText();
                  urlSchema.parse(text);
                  setLink(text);
                  handleParse(text);
                } catch {
                  setError("剪贴板内容不是有效 URL");
                }
              }}
              disabled={loading}
              type="button"
              title="粘贴剪贴板内容"
            >
              <Clipboard className="h-4 w-4" />
            </button>
          </div>
        </div>

        <Button
          onClick={() => handleParse()}
          disabled={loading || !link.trim()}
          className="h-12 rounded-[var(--radius-lg)] px-5"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              解析中
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              解析
            </span>
          )}
        </Button>
      </div>

      <div className="min-h-[1.25rem] text-xs text-[var(--muted-foreground)]">
        {showSuccess ? (
          <span className="fade-in inline-flex items-center gap-1 text-[var(--success)]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            解析成功，进入下一步
          </span>
        ) : (
          <span>支持读取剪贴板，也可手动输入</span>
        )}
      </div>
    </div>
  );

  const renderSiteInfoForm = () => (
    <div className="slide-up space-y-4 pt-1">
      <div className="card flex items-center gap-3 p-4">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-[var(--primary-200)] bg-gradient-to-br from-[var(--primary-100)] to-[var(--primary-50)]">
          <FaviconImage
            key={`site-preview-${siteInfo?.favicon || "none"}`}
            src={siteInfo?.favicon}
            alt="网站图标"
            size={36}
            imageClassName="object-contain"
            iconClassName="w-4 h-4 text-[var(--primary-700)]"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--foreground)]">
            {escapeHtml(editedTitle || siteInfo?.title || "未命名网站")}
          </p>
          <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
            {escapeHtml(siteInfo?.url || "")}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Input
          placeholder="网站标题"
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          disabled={isSubmitting}
          className="h-12 text-base font-medium"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleConfirm();
          }}
        />
        <Input
          placeholder="图标URL (可选)"
          value={siteInfo?.favicon || ""}
          onChange={(e) =>
            setSiteInfo((prev) => (prev ? { ...prev, favicon: e.target.value } : null))
          }
          disabled={isSubmitting}
          className="h-11 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          variant="outline"
          onClick={resetToUrlStep}
          disabled={isSubmitting}
          className="h-11 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          重新输入链接
        </Button>

        <Button onClick={handleConfirm} disabled={isSubmitting} className="h-11 gap-2">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              正在添加...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              确认添加
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setError("");
          setShowSuccess(false);
        }
        onOpenChange?.(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {siteInfo ? "确认站点信息" : "添加新链接"}
          </DialogTitle>
          <DialogDescription className="text-sm text-[var(--foreground-secondary)]">
            {siteInfo ? "检查信息后添加到当前分类" : "输入网址并自动获取网站信息"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {renderStepIndicator()}

          {error && (
            <div className="fade-in flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--error)]/25 bg-[var(--error)]/10 p-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--error)]" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--error)]">解析提示</p>
                <p className="mt-1 text-xs text-[var(--error)]/85">{error}</p>
              </div>
            </div>
          )}

          {!siteInfo ? renderUrlInputSection() : renderSiteInfoForm()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
