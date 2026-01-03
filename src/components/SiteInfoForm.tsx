/**
 * 站点信息表单组件
 * 显示解析结果并允许编辑
 */

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import type { Site } from "@/lib/storage/local-storage";

interface SiteInfoFormProps {
  siteInfo: Site;
  editedTitle: string;
  onTitleChange: (title: string) => void;
  onFaviconChange: (favicon: string) => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
}

export function SiteInfoForm({
  siteInfo,
  editedTitle,
  onTitleChange,
  onFaviconChange,
  onSubmit,
  isSubmitting,
}: SiteInfoFormProps) {
  return (
    <div className="space-y-4 pt-2">
      {/* 站点预览卡片 */}
      <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)]">
        <div className="w-10 h-10 rounded-md bg-[var(--primary-100)] flex items-center justify-center overflow-hidden border border-[var(--primary-200)]">
          {siteInfo.favicon ? (
            <Image
              src={siteInfo.favicon}
              alt="网站图标"
              width={32}
              height={32}
              className="object-contain"
              unoptimized
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.parentElement!.style.display = "none";
              }}
            />
          ) : (
            <span className="text-xs text-[var(--primary-600)] font-bold">URL</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--foreground)] truncate">
            {editedTitle || siteInfo.title || "未命名网站"}
          </p>
          <p className="text-xs text-[var(--muted-foreground)] truncate">
            {siteInfo.url}
          </p>
        </div>
      </div>

      {/* 编辑表单 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Input
            placeholder="图标URL"
            value={siteInfo.favicon || ""}
            onChange={(e) => onFaviconChange(e.target.value)}
            disabled={isSubmitting}
            className="h-11 text-sm"
          />
          {siteInfo.favicon && (
            <div className="relative w-8 h-8 rounded-md overflow-hidden border border-[var(--border)] bg-[var(--muted)] flex items-center justify-center flex-shrink-0">
              <Image
                src={siteInfo.favicon}
                alt="预览"
                width={28}
                height={28}
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
          placeholder="标题"
          value={editedTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          disabled={isSubmitting}
          className="h-11 text-base font-medium"
        />
      </div>

      <Button
        onClick={onSubmit}
        className="w-full cursor-pointer h-11 text-base"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            添加中...
          </div>
        ) : (
          "确认添加"
        )}
      </Button>
    </div>
  );
}
