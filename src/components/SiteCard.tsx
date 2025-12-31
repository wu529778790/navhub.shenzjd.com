/**
 * 站点卡片组件
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
import { Pencil, Trash2, Link as LinkIcon } from "lucide-react";
import type { Site } from "@/lib/storage/local-storage";

interface SiteCardProps {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  categoryId: string;
  onSiteChange?: () => void;
}

export function SiteCard({
  id,
  title: initialTitle,
  url,
  favicon = "",
  categoryId,
  onSiteChange,
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

  const handleCardClick = (e: React.MouseEvent) => {
    // 如果是访客模式，直接打开链接
    if (isGuestMode) {
      window.open(url, "_blank");
      return;
    }
    // 如果点击的是图标，也打开链接
    if ((e.target as HTMLElement).closest('.site-icon')) {
      window.open(url, "_blank");
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isGuestMode) return; // 访客模式不允许编辑

    setIsContextMenuOpen(true);
  };

  const openEditDialog = () => {
    setEditedTitle(initialTitle);
    setEditedUrl(url);
    setEditedFavicon(favicon);
    setIsEditDialogOpen(true);
    setIsContextMenuOpen(false);
  };

  return (
    <>
      <div
        ref={cardRef}
        key={id}
        onClick={handleCardClick}
        onContextMenu={handleContextMenu}
        className="flex flex-col items-center gap-2 cursor-pointer group w-[80px] relative"
      >
        {/* 右键菜单指示器 - 仅在非访客模式且鼠标悬停时显示 */}
        {!isGuestMode && (
          <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-gray-200 rounded-full w-5 h-5 flex items-center justify-center text-xs text-gray-600">
              ⋮
            </div>
          </div>
        )}

        <div className="site-icon w-12 h-12 relative flex items-center justify-center rounded-xl overflow-hidden bg-white shadow-sm group-hover:shadow-md transition-all duration-200">
          {favicon ? (
            <Image
              src={favicon}
              alt={initialTitle}
              fill
              className="object-cover"
              unoptimized
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-100" />
          )}
        </div>
        <span className="text-xs text-center text-gray-600 truncate w-full">
          {initialTitle}
        </span>

        {/* 右键菜单 */}
        {isContextMenuOpen && (
          <div
            ref={contextMenuRef}
            className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-28 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={openEditDialog}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <Pencil className="w-3 h-3" />
              编辑
            </button>
            <button
              onClick={() => {
                setIsDeleteAlertOpen(true);
                setIsContextMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg"
            >
              <Trash2 className="w-3 h-3" />
              删除
            </button>
          </div>
        )}
      </div>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑站点</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="标题"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              disabled={isLoading}
            />
            <Input
              placeholder="URL"
              value={editedUrl}
              onChange={(e) => setEditedUrl(e.target.value)}
              disabled={isLoading}
            />
            <Input
              placeholder="图标 URL (可选)"
              value={editedFavicon}
              onChange={(e) => setEditedFavicon(e.target.value)}
              disabled={isLoading}
            />
            <Button
              onClick={handleEdit}
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "保存中..." : "保存"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除 "{initialTitle}" 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "删除中..." : "删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
