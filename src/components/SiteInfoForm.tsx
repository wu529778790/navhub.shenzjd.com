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
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            placeholder="图标URL"
            value={siteInfo.favicon || ""}
            onChange={(e) => onFaviconChange(e.target.value)}
            disabled={isSubmitting}
          />
          {siteInfo.favicon && (
            <div className="relative w-6 h-6 flex-shrink-0">
              <Image
                src={siteInfo.favicon}
                alt="网站图标"
                fill
                sizes="24px"
                className="object-contain"
                unoptimized
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
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
        />
      </div>

      <Button
        onClick={onSubmit}
        className="w-full cursor-pointer"
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
