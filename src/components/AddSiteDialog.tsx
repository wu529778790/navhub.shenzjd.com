/**
 * 添加站点对话框
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
import { UrlInput } from "./UrlInput";
import { SiteInfoForm } from "./SiteInfoForm";
import { parseURL } from "@/lib/services/url-parser";
import type { Site } from "@/lib/storage/local-storage";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加链接</DialogTitle>
          <DialogDescription>快速添加一个新网站链接到当前分类</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <UrlInput
            link={link}
            onLinkChange={setLink}
            onParse={handleParse}
            loading={loading}
          />

          {error && (
            <div className="rounded-md bg-[var(--error)]/10 border border-[var(--error)]/20 p-3">
              <p className="text-sm text-[var(--error)]">{error}</p>
            </div>
          )}

          {siteInfo && (
            <SiteInfoForm
              siteInfo={siteInfo}
              editedTitle={editedTitle}
              onTitleChange={setEditedTitle}
              onFaviconChange={(favicon) =>
                setSiteInfo((prev) => (prev ? { ...prev, favicon } : null))
              }
              onSubmit={handleConfirm}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
