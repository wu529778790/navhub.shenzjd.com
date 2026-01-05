/**
 * 站点卡片组件 - 现代化设计
 * - 正常点击：打开链接
 * - 右键/长按：显示编辑菜单
 */

"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useSites } from "@/contexts/SitesContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Globe } from "lucide-react";

interface SiteCardProps {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  categoryId: string;
  index: number;
  onSiteChange?: () => void;
  view?: 'grid' | 'list';
}

export function SiteCard({
  id,
  title: initialTitle,
  url,
  favicon = "",
  categoryId,
  index,
  onSiteChange,
  view = 'grid',
}: SiteCardProps) {
  const { updateSite, deleteSite, isGuestMode } = useSites();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [editedTitle, setEditedTitle] = useState(initialTitle);
  const [editedUrl, setEditedUrl] = useState(url);
  const [editedFavicon, setEditedFavicon] = useState(favicon);
  const [isLoading, setIsLoading] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  // 点击外部或右键关闭右键菜单
  useEffect(() => {
    if (!isContextMenuOpen) return;

    // 防止页面滚动
    document.body.style.overflow = 'hidden';

    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setIsContextMenuOpen(false);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      // 如果右键点击的不是菜单内部，关闭菜单
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setIsContextMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [isContextMenuOpen]);

  // 清理长按定时器
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // 获取域名（用于无图标时的占位符）
  const getDomain = () => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  };

  // 获取首字母（用于无图标时的占位符）
  const getInitial = () => {
    return initialTitle.charAt(0).toUpperCase();
  };

  const handleEdit = async () => {
    try {
      setIsLoading(true);
      await updateSite(categoryId, id, {
        id,
        title: editedTitle,
        url: editedUrl,
        favicon: editedFavicon,
      });
      setIsEditDialogOpen(false);
      onSiteChange?.();
    } catch (error) {
      console.error("Failed to update site:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await deleteSite(categoryId, id);
      setIsDeleteAlertOpen(false);
      onSiteChange?.();
    } catch (error) {
      console.error("Failed to delete site:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 正常点击 - 打开链接
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 如果右键菜单已打开，关闭菜单
    if (isContextMenuOpen) {
      setIsContextMenuOpen(false);
      return;
    }

    // 打开链接
    window.open(url, "_blank");
  };

  // 右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isGuestMode) return;

    setIsContextMenuOpen(true);
  };

  // 长按处理（移动端）- Skills 规范优化
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isGuestMode) return;

    // 记录触摸起始位置，用于检测滑动取消
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

    longPressTimer.current = setTimeout(() => {
      setIsContextMenuOpen(true);
      // 震动反馈（如果支持）- 增强反馈
      if (navigator.vibrate) {
        navigator.vibrate([30, 20, 30]); // 更明显的模式
      }
      // 视觉反馈 - 临时缩放
      if (cardRef.current) {
        cardRef.current.style.transform = 'scale(0.98)';
        setTimeout(() => {
          if (cardRef.current) cardRef.current.style.transform = '';
        }, 150);
      }
    }, 450); // 450ms 长按（略微缩短）
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    touchStartPos.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (longPressTimer.current && touchStartPos.current) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);

      // 如果移动超过 10px，取消长按
      if (deltaX > 10 || deltaY > 10) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
        touchStartPos.current = null;
      }
    }
  };

  const openEditDialog = () => {
    setEditedTitle(initialTitle);
    setEditedUrl(url);
    setEditedFavicon(favicon);
    setIsEditDialogOpen(true);
    setIsContextMenuOpen(false);
  };

  // 右键菜单操作
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openEditDialog();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteAlertOpen(true);
    setIsContextMenuOpen(false);
  };

  // 删除确认弹窗内容（两个视图共用）
  const DeleteConfirmDialog = () => (
    <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
      <AlertDialogContent className="sm:max-w-md bg-[var(--background)]/95 backdrop-blur-2xl border border-[var(--border)] rounded-[var(--radius-2xl)] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)] p-6">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-[var(--error)]/10 flex items-center justify-center border border-[var(--error)]/20">
              <Trash2 className="w-5 h-5 text-[var(--error)]" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold text-[var(--foreground)]">确认删除站点</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-[var(--foreground-secondary)] text-base leading-relaxed mt-2">
            确定要删除 <strong className="text-[var(--error)] font-semibold">{initialTitle}</strong> 吗？
            <br />
            <span className="text-sm text-[var(--muted-foreground)] mt-1 inline-block">此操作无法撤销，数据将从本地和 GitHub 同步删除。</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 pt-4 mt-4 border-t border-[var(--border)] w-full">
          <AlertDialogCancel className={cn(
            "flex-1 h-12 rounded-[var(--radius-xl)] text-base font-medium",
            "bg-[var(--background)] border border-[var(--border)]",
            "hover:bg-[var(--background-secondary)] hover:border-[var(--border-strong)]",
            "transition-all duration-200 active:scale-95",
            "text-base font-medium"
          )}>
            取消
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className={cn(
              "flex-1 h-12 rounded-[var(--radius-xl)] text-base font-medium",
              "bg-gradient-to-r from-[var(--error)] to-red-600 text-white",
              "hover:from-red-600 hover:to-red-700",
              "text-white font-medium shadow-lg shadow-red-500/30",
              "transition-all duration-200 active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100",
              "text-base font-medium"
            )}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>删除中...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" />
                <span>确认删除</span>
              </div>
            )}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );

  // 网格视图
  if (view === 'grid') {
    return (
      <>
        <div
          ref={cardRef}
          key={id}
          onClick={handleCardClick}
          onContextMenu={handleContextMenu}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
          className="site-card cursor-pointer"
          title={isGuestMode ? "点击打开链接" : "点击打开链接，右键或长按显示菜单"}
        >
          {/* 图标 */}
          <div className="site-icon-wrapper">
            {favicon ? (
              <Image
                src={favicon}
                alt={initialTitle}
                fill
                className="object-cover"
                unoptimized
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.parentElement!.style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary-100)] to-[var(--primary-50)] text-[var(--primary-700)] font-bold text-lg">
                {getInitial()}
              </div>
            )}
          </div>

          {/* 标题 */}
          <span className="site-title">{initialTitle}</span>

          {/* 右键菜单 - 仅在非访客模式 */}
          {!isGuestMode && isContextMenuOpen && (
            <div
              ref={contextMenuRef}
              className={cn(
                "absolute top-full mt-2 left-0 z-[90] w-auto",
                "bg-[var(--background)]/95 backdrop-blur-xl",
                "border border-[var(--border)] rounded-[var(--radius-xl)]",
                "shadow-[0_10px_40px_-12px_rgba(0,0,0,0.15)]",
                "p-1.5 animate-in fade-in zoom-in-95",
                "overflow-hidden"
              )}
            >
              <button
                onClick={handleEditClick}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)]",
                  "hover:bg-[var(--primary-50)] text-[var(--foreground)]",
                  "text-sm font-medium transition-all active:scale-95",
                  "group relative overflow-hidden whitespace-nowrap"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-md bg-[var(--primary-100)] flex items-center justify-center",
                  "group-hover:bg-[var(--primary-200)] transition-colors"
                )}>
                  <Pencil className="w-3.5 h-3.5 text-[var(--primary-600)] group-hover:scale-110 transition-transform" />
                </div>
                <span>编辑站点</span>
              </button>
              <button
                onClick={handleDeleteClick}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)]",
                  "hover:bg-[var(--error)]/10 text-[var(--error)]",
                  "text-sm font-medium transition-all active:scale-95 mt-0.5",
                  "group relative overflow-hidden whitespace-nowrap"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-md bg-[var(--error)]/10 flex items-center justify-center",
                  "group-hover:bg-[var(--error)]/20 transition-colors"
                )}>
                  <Trash2 className="w-3.5 h-3.5 text-[var(--error)] group-hover:scale-110 transition-transform" />
                </div>
                <span>删除站点</span>
              </button>
            </div>
          )}
        </div>

        {/* 编辑对话框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md bg-[var(--background)]/95 backdrop-blur-2xl border border-[var(--border)] rounded-[var(--radius-2xl)] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)] p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-[var(--foreground)]">编辑站点</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground-secondary)]">标题</label>
                <Input
                  placeholder="站点名称"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  disabled={isLoading}
                  className={cn(
                    "h-12 rounded-[var(--radius-lg)]",
                    "bg-[var(--background)]/80 backdrop-blur-sm",
                    "border-[var(--border)] hover:border-[var(--primary-400)]",
                    "focus:border-[var(--primary-500)] focus:ring-2 focus:ring-[var(--primary-500)]/20"
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground-secondary)]">URL</label>
                <Input
                  placeholder="https://example.com"
                  value={editedUrl}
                  onChange={(e) => setEditedUrl(e.target.value)}
                  disabled={isLoading}
                  className={cn(
                    "h-12 rounded-[var(--radius-lg)]",
                    "bg-[var(--background)]/80 backdrop-blur-sm",
                    "border-[var(--border)] hover:border-[var(--primary-400)]",
                    "focus:border-[var(--primary-500)] focus:ring-2 focus:ring-[var(--primary-500)]/20"
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground-secondary)]">图标 URL (可选)</label>
                <Input
                  placeholder="https://example.com/favicon.ico"
                  value={editedFavicon}
                  onChange={(e) => setEditedFavicon(e.target.value)}
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
                onClick={() => setIsEditDialogOpen(false)}
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
                onClick={handleEdit}
                className={cn(
                  "flex-1 h-12 rounded-[var(--radius-xl)] text-base font-medium",
                  "bg-gradient-to-r from-[var(--primary-600)] to-[var(--primary-500)]",
                  "hover:from-[var(--primary-700)] hover:to-[var(--primary-600)]",
                  "text-white font-medium shadow-lg shadow-[var(--primary-500)]/20",
                  "transition-all duration-200 active:scale-95",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                )}
                disabled={isLoading}
              >
                {isLoading ? "保存中..." : "保存"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 删除确认对话框 */}
        <DeleteConfirmDialog />
      </>
    );
  }

  // 列表视图
  return (
    <>
      <div
        ref={cardRef}
        key={id}
        onClick={handleCardClick}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] transition-all duration-200 hover:shadow-md hover:border-[var(--primary-300)] hover:translate-x-1 cursor-pointer"
        title={isGuestMode ? "点击打开链接" : "点击打开链接，右键或长按显示菜单"}
      >
        {/* 图标 */}
        <div className="site-icon-wrapper w-10 h-10 flex-shrink-0">
          {favicon ? (
            <Image
              src={favicon}
              alt={initialTitle}
              fill
              className="object-cover"
              unoptimized
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.parentElement!.style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary-100)] to-[var(--primary-50)] text-[var(--primary-700)] font-bold text-sm">
              {getInitial()}
            </div>
          )}
        </div>

        {/* 标题和URL */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[var(--foreground)] truncate">{initialTitle}</div>
          <div className="text-xs text-[var(--foreground-secondary)] truncate flex items-center gap-1">
            <Globe className="w-3 h-3" />
            {getDomain()}
          </div>
        </div>

        {/* 右键菜单 - 仅在非访客模式 */}
        {!isGuestMode && isContextMenuOpen && (
          <div
            ref={contextMenuRef}
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 z-[90] w-auto",
              "bg-[var(--background)]/95 backdrop-blur-xl",
              "border border-[var(--border)] rounded-[var(--radius-xl)]",
              "shadow-[0_10px_40px_-12px_rgba(0,0,0,0.15)]",
              "p-1.5 animate-in fade-in zoom-in-95",
              "overflow-hidden"
            )}
          >
            <button
              onClick={handleEditClick}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)]",
                "hover:bg-[var(--primary-50)] text-[var(--foreground)]",
                "text-sm font-medium transition-all active:scale-95",
                "group relative overflow-hidden whitespace-nowrap"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-md bg-[var(--primary-100)] flex items-center justify-center",
                "group-hover:bg-[var(--primary-200)] transition-colors"
              )}>
                <Pencil className="w-3.5 h-3.5 text-[var(--primary-600)] group-hover:scale-110 transition-transform" />
              </div>
              <span>编辑站点</span>
            </button>
            <button
              onClick={handleDeleteClick}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)]",
                "hover:bg-[var(--error)]/10 text-[var(--error)]",
                "text-sm font-medium transition-all active:scale-95 mt-0.5",
                "group relative overflow-hidden whitespace-nowrap"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-md bg-[var(--error)]/10 flex items-center justify-center",
                "group-hover:bg-[var(--error)]/20 transition-colors"
              )}>
                <Trash2 className="w-3.5 h-3.5 text-[var(--error)] group-hover:scale-110 transition-transform" />
              </div>
              <span>删除站点</span>
            </button>
          </div>
        )}
      </div>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md bg-[var(--background)]/95 backdrop-blur-2xl border border-[var(--border)] rounded-[var(--radius-2xl)] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)] p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[var(--foreground)]">编辑站点</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground-secondary)]">标题</label>
              <Input
                placeholder="站点名称"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                disabled={isLoading}
                className={cn(
                  "h-12 rounded-[var(--radius-lg)]",
                  "bg-[var(--background)]/80 backdrop-blur-sm",
                  "border-[var(--border)] hover:border-[var(--primary-400)]",
                  "focus:border-[var(--primary-500)] focus:ring-2 focus:ring-[var(--primary-500)]/20"
                )}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground-secondary)]">URL</label>
              <Input
                placeholder="https://example.com"
                value={editedUrl}
                onChange={(e) => setEditedUrl(e.target.value)}
                disabled={isLoading}
                className={cn(
                  "h-12 rounded-[var(--radius-lg)]",
                  "bg-[var(--background)]/80 backdrop-blur-sm",
                  "border-[var(--border)] hover:border-[var(--primary-400)]",
                  "focus:border-[var(--primary-500)] focus:ring-2 focus:ring-[var(--primary-500)]/20"
                )}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground-secondary)]">图标 URL (可选)</label>
              <Input
                placeholder="https://example.com/favicon.ico"
                value={editedFavicon}
                onChange={(e) => setEditedFavicon(e.target.value)}
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
              onClick={() => setIsEditDialogOpen(false)}
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
              onClick={handleEdit}
              className={cn(
                "flex-1 h-12 rounded-[var(--radius-xl)] text-base font-medium",
                "bg-gradient-to-r from-[var(--primary-600)] to-[var(--primary-500)]",
                "hover:from-[var(--primary-700)] hover:to-[var(--primary-600)]",
                "text-white font-medium shadow-lg shadow-[var(--primary-500)]/20",
                "transition-all duration-200 active:scale-95",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              )}
              disabled={isLoading}
            >
              {isLoading ? "保存中..." : "保存"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog />
    </>
  );
}
