/**
 * URL 输入组件
 * 输入 URL 并自动解析
 */

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clipboard } from "lucide-react";
import { z } from "zod";

const urlSchema = z.string().url("请输入有效的URL");

interface UrlInputProps {
  link: string;
  onLinkChange: (link: string) => void;
  onParse: (url?: string) => Promise<void>;
  loading: boolean;
}

export function UrlInput({ link, onLinkChange, onParse, loading }: UrlInputProps) {
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Input
          placeholder="请输入链接（如：https://example.com）"
          value={link}
          onChange={(e) => onLinkChange(e.target.value)}
          disabled={loading}
          className="pr-8"
        />
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          onClick={async () => {
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
        </button>
      </div>
      <Button
        onClick={() => onParse()}
        disabled={loading}
        className="cursor-pointer"
      >
        {loading ? "解析中..." : "解析"}
      </Button>
    </div>
  );
}
