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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Pencil, Trash2, Link as LinkIcon, Globe } from "lucide-react";

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

  // 点击外部关闭右键菜单
  useEffect(() => {
    if (!isContextMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setIsContextMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
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

  // 长按处理（移动端）
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isGuestMode) return;

    longPressTimer.current = setTimeout(() => {
      setIsContextMenuOpen(true);
      // 震动反馈（如果支持）
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms 长按
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchMove = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
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
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[var(--error)]/10 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-[var(--error)]" />
            </div>
            <AlertDialogTitle>确认删除站点</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            确定要删除 <strong className="text-[var(--error)]">{initialTitle}</strong> 吗？
            <br />
            <span className="text-xs opacity-75">此操作无法撤销，数据将从本地和 GitHub 同步删除。</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="gap-1">
            <span>取消</span>
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-[var(--error)] hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/20 transition-all gap-1"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>删除中...</span>
              </div>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>确认删除</span>
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
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

          {/* 访客模式下的提示 */}
          {isGuestMode && (
            <div className="absolute inset-0 bg-[var(--primary-600)]/0 hover:bg-[var(--primary-600)]/10 transition-colors rounded-[var(--radius-md)] flex items-center justify-center opacity-0 hover:opacity-100">
              <LinkIcon className="w-4 h-4 text-[var(--primary-600)]" />
            </div>
          )}

          {/* 右键菜单 - 仅在非访客模式 */}
          {!isGuestMode && isContextMenuOpen && (
            <div
              ref={contextMenuRef}
              className="absolute top-full mt-2 right-0 z-50 min-w-[140px] bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius-md)] shadow-xl p-1 animate-in fade-in zoom-in-95"
            >
              <button
                onClick={handleEditClick}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] hover:bg-[var(--primary-50)] text-[var(--foreground)] text-sm transition-colors"
              >
                <Pencil className="w-4 h-4" />
                编辑
              </button>
              <button
                onClick={handleDeleteClick}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] hover:bg-[var(--error)]/10 text-[var(--error)] text-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            </div>
          )}
        </div>

        {/* 编辑对话框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>编辑站点</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground-secondary)]">标题</label>
                <Input
                  placeholder="站点名称"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground-secondary)]">URL</label>
                <Input
                  placeholder="https://example.com"
                  value={editedUrl}
                  onChange={(e) => setEditedUrl(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground-secondary)]">图标 URL (可选)</label>
                <Input
                  placeholder="https://example.com/favicon.ico"
                  value={editedFavicon}
                  onChange={(e) => setEditedFavicon(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1"
                disabled={isLoading}
              >
                取消
              </Button>
              <Button
                onClick={handleEdit}
                className="flex-1"
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

        {/* 打开链接按钮 - 访客模式 */}
        {isGuestMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(url, "_blank");
            }}
            className="p-2 rounded-[var(--radius-sm)] hover:bg-[var(--primary-100)] text-[var(--primary-600)] transition-colors"
            title="打开链接"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        )}

        {/* 右键菜单 - 仅在非访客模式 */}
        {!isGuestMode && isContextMenuOpen && (
          <div
            ref={contextMenuRef}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 min-w-[140px] bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius-md)] shadow-xl p-1 animate-in fade-in zoom-in-95"
          >
            <button
              onClick={handleEditClick}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] hover:bg-[var(--primary-50)] text-[var(--foreground)] text-sm transition-colors"
            >
              <Pencil className="w-4 h-4" />
              编辑
            </button>
            <button
              onClick={handleDeleteClick}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] hover:bg-[var(--error)]/10 text-[var(--error)] text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              删除
            </button>
          </div>
        )}
      </div>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>编辑站点</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground-secondary)]">标题</label>
              <Input
                placeholder="站点名称"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground-secondary)]">URL</label>
              <Input
                placeholder="https://example.com"
                value={editedUrl}
                onChange={(e) => setEditedUrl(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground-secondary)]">图标 URL (可选)</label>
              <Input
                placeholder="https://example.com/favicon.ico"
                value={editedFavicon}
                onChange={(e) => setEditedFavicon(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="flex-1"
              disabled={isLoading}
            >
              取消
            </Button>
            <Button
              onClick={handleEdit}
              className="flex-1"
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
