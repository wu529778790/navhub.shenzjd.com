/**
 * 添加站点对话框 - 现代化玻璃拟态设计
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
import { z } from "zod";
import { useSites } from "@/contexts/SitesContext";
import { parseURL } from "@/lib/services/url-parser";
import type { Site } from "@/lib/storage/local-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clipboard, Link as LinkIcon, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const urlSchema = z.string().url("请输入有效的URL");

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

  const handleParse = useCallback(
    async (urlToCheck?: string) => {
      try {
        const urlToValidate = urlToCheck || link;
        urlSchema.parse(urlToValidate);
        setLoading(true);
        setError("");
        setIsSubmitting(false);

        // 使用 URL 解析服务获取网站信息
        const { title, favicon } = await parseURL(urlToValidate);

        setSiteInfo({
          id: Date.now().toString(),
          title,
          favicon,
          url: urlToValidate,
        });
        setEditedTitle(title);
        setLoading(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      } catch (err) {
        // 如果发生错误，创建一个基本的siteInfo对象
        setSiteInfo({
          id: Date.now().toString(),
          title: "",
          favicon: "",
          url: link,
        });
        setEditedTitle("");
        setError(err instanceof Error ? err.message : "发生未知错误");
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
          console.log("剪贴板内容不是有效URL");
        }
      } catch (err) {
        console.log("无法访问剪贴板:", err);
      }
    };

    checkClipboard();
  }, [open, handleParse]);

  const handleConfirm = async () => {
    if (!siteInfo) return;

    try {
      setIsSubmitting(true);
      await addSite(activeCategory, {
        id: Date.now().toString(),
        title: editedTitle || siteInfo.title,
        favicon: siteInfo.favicon,
        url: siteInfo.url,
      });

      // 重置状态
      setLink("");
      setSiteInfo(null);
      setEditedTitle("");
      onOpenChange?.(false);

      // 调用成功回调函数
      onSuccess?.();
    } catch (error) {
      console.error("添加站点失败:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // URL输入阶段组件
  const renderUrlInputSection = () => (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="输入网站链接 (如: https://example.com)"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            disabled={loading}
            className={cn(
              "pr-12 h-12 text-base rounded-[var(--radius-lg)]",
              "bg-[var(--background)]/80 backdrop-blur-sm",
              "border-[var(--border)] hover:border-[var(--primary-400)]",
              "focus:border-[var(--primary-500)] focus:ring-2 focus:ring-[var(--primary-500)]/20",
              "transition-all duration-200",
              loading && "opacity-70"
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter" && link) {
                e.preventDefault();
                handleParse();
              }
            }}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            {/* 剪贴板按钮 */}
            <button
              className={cn(
                "p-1.5 rounded-[var(--radius-md)] cursor-pointer",
                "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
                "hover:bg-[var(--muted)] transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]",
                "active:scale-95",
                loading && "opacity-50 cursor-not-allowed"
              )}
              onClick={async () => {
                if (loading) return;
                try {
                  const text = await navigator.clipboard.readText();
                  try {
                    urlSchema.parse(text);
                    setLink(text);
                    handleParse(text);
                  } catch {
                    console.log("剪贴板内容不是有效URL");
                  }
                } catch (err) {
                  console.log("无法访问剪贴板:", err);
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
          disabled={loading || !link}
          className={cn(
            "h-12 px-5 rounded-[var(--radius-lg)] cursor-pointer",
            "bg-[var(--primary-600)] hover:bg-[var(--primary-700)]",
            "text-white font-medium shadow-lg shadow-[var(--primary-500)]/20",
            "transition-all duration-200 active:scale-95",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          )}
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

      {/* 状态提示 */}
      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] min-h-[1.25rem]">
        {showSuccess && (
          <span className="flex items-center gap-1 text-[var(--success)] animate-in fade-in slide-in-from-left-2">
            <CheckCircle2 className="h-3.5 w-3.5" />
            解析成功
          </span>
        )}
        {!showSuccess && !loading && (
          <span>支持自动读取剪贴板，或手动输入后解析</span>
        )}
      </div>
    </div>
  );

  // 站点信息表单组件
  const renderSiteInfoForm = () => (
    <div className="space-y-4 pt-2">
      {/* 站点预览卡片 - 玻璃拟态设计 */}
      <div className={cn(
        "flex items-center gap-3 p-4 rounded-[var(--radius-xl)]",
        "bg-[var(--background-secondary)]/80 backdrop-blur-sm",
        "border border-[var(--border)]",
        "hover:border-[var(--primary-400)] transition-all duration-200",
        "shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
      )}>
        <div className={cn(
          "w-12 h-12 rounded-[var(--radius-lg)]",
          "bg-gradient-to-br from-[var(--primary-100)] to-[var(--primary-50)]",
          "flex items-center justify-center overflow-hidden",
          "border border-[var(--primary-200)]",
          "shadow-inner"
        )}>
          {siteInfo?.favicon ? (
            <Image
              src={siteInfo.favicon}
              alt="网站图标"
              width={36}
              height={36}
              className="object-contain"
              unoptimized
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.parentElement!.style.display = "none";
              }}
            />
          ) : (
            <span className="text-xs font-bold text-[var(--primary-700)]">URL</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--foreground)] truncate">
            {editedTitle || siteInfo?.title || "未命名网站"}
          </p>
          <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">
            {siteInfo?.url}
          </p>
        </div>
      </div>

      {/* 编辑表单 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Input
            placeholder="图标URL (可选)"
            value={siteInfo?.favicon || ""}
            onChange={(e) =>
              setSiteInfo((prev) => (prev ? { ...prev, favicon: e.target.value } : null))
            }
            disabled={isSubmitting}
            className={cn(
              "h-11 text-sm flex-1",
              "bg-[var(--background)]/80 backdrop-blur-sm",
              "border-[var(--border)] hover:border-[var(--primary-400)]",
              "focus:border-[var(--primary-500)] focus:ring-2 focus:ring-[var(--primary-500)]/20"
            )}
          />
          {siteInfo?.favicon && (
            <div className={cn(
              "relative w-10 h-10 rounded-[var(--radius-md)] overflow-hidden cursor-pointer",
              "border border-[var(--border)] bg-[var(--muted)]",
              "flex items-center justify-center flex-shrink-0",
              "hover:scale-105 transition-transform duration-200"
            )}>
              <Image
                src={siteInfo.favicon}
                alt="预览"
                width={36}
                height={36}
                className="object-contain"
                unoptimized
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.parentElement!.style.display = "none";
                }}
              />
            </div>
          )}
        </div>
        <Input
          placeholder="网站标题"
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          disabled={isSubmitting}
          className={cn(
            "h-12 text-base font-medium",
            "bg-[var(--background)]/80 backdrop-blur-sm",
            "border-[var(--border)] hover:border-[var(--primary-400)]",
            "focus:border-[var(--primary-500)] focus:ring-2 focus:ring-[var(--primary-500)]/20"
          )}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleConfirm();
          }}
        />
      </div>

      {/* 提交按钮 */}
      <Button
        onClick={handleConfirm}
        disabled={isSubmitting}
        className={cn(
          "w-full h-12 text-base font-semibold rounded-[var(--radius-lg)] cursor-pointer",
          "bg-gradient-to-r from-[var(--primary-600)] to-[var(--primary-500)]",
          "hover:from-[var(--primary-700)] hover:to-[var(--primary-600)]",
          "text-white shadow-lg shadow-[var(--primary-500)]/30",
          "transition-all duration-200 active:scale-95",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        )}
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            正在添加...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            确认添加
          </span>
        )}
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {siteInfo ? "确认站点信息" : "添加新链接"}
          </DialogTitle>
          <DialogDescription className="text-[var(--foreground-secondary)] text-sm">
            {siteInfo
              ? "检查并编辑站点信息，然后添加到导航"
              : "输入网址并自动获取网站信息，快速添加到导航栏"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* 错误提示 */}
          {error && (
            <div className={cn(
              "flex items-start gap-3 p-3 rounded-[var(--radius-lg)]",
              "bg-[var(--error)]/10 border border-[var(--error)]/20",
              "animate-in fade-in slide-in-from-top-2"
            )}>
              <AlertCircle className="h-5 w-5 text-[var(--error)] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--error)]">解析失败</p>
                <p className="text-xs text-[var(--error)]/80 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* 主要内容区域 */}
          {!siteInfo ? renderUrlInputSection() : renderSiteInfoForm()}
        </div>
      </DialogContent>
    </Dialog>
  );
}