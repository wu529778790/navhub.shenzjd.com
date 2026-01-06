/**
 * URL 输入组件
 * 输入 URL 并自动解析
 */

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clipboard } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";

const urlSchema = z.string().url("请输入有效的URL");

interface UrlInputProps {
  link: string;
  onLinkChange: (link: string) => void;
  onParse: (url?: string) => Promise<void>;
  loading: boolean;
}

export function UrlInput({ link, onLinkChange, onParse, loading }: UrlInputProps) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="请输入链接（如：https://example.com）"
            value={link}
            onChange={(e) => onLinkChange(e.target.value)}
            disabled={loading}
            className="pr-10 h-11 text-base"
            onKeyDown={(e) => {
              if (e.key === "Enter" && link) {
                e.preventDefault();
                onParse();
              }
            }}
          />
          <button
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md cursor-pointer",
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
                  onLinkChange(text);
                  onParse(text);
                } catch {
                  console.log("剪贴板内容不是有效URL");
                }
              } catch (err) {
                console.log("无法访问剪贴板:", err);
              }
            }}
            disabled={loading}
            type="button"
          >
            <Clipboard className="h-4 w-4" />
            <span className="sr-only">粘贴剪贴板内容</span>
          </button>
        </div>
        <Button
          onClick={() => onParse()}
          disabled={loading || !link}
          className={cn(
            "cursor-pointer min-w-24 h-11",
            "transition-all duration-200",
            "active:scale-95"
          )}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              解析中
            </span>
          ) : (
            "解析链接"
          )}
        </Button>
      </div>

      {/* 提示信息 */}
      <p className="text-xs text-[var(--muted-foreground)]">
        支持自动从剪贴板读取链接，或手动输入后点击解析
      </p>
    </div>
  );
}
