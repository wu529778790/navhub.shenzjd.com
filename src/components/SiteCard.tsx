/**
 * 站点卡片组件
 */

"use client";

import Image from "next/image";
import { useState } from "react";
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
import { Pencil, Trash2 } from "lucide-react";
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
  const { updateSite, deleteSite } = useSites();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [editedTitle, setEditedTitle] = useState(initialTitle);
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = async () => {
    try {
      setIsLoading(true);
      await updateSite(categoryId, id, {
        id,
        title: editedTitle,
        url,
        favicon,
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

  const handleCardClick = () => {
    window.open(url, "_blank");
  };

  return (
    <>
      <div
        key={id}
        onClick={handleCardClick}
        className="flex flex-col items-center gap-2 cursor-pointer group w-[80px]"
      >
        <div className="w-12 h-12 relative flex items-center justify-center rounded-xl overflow-hidden bg-white shadow-sm group-hover:shadow-md transition-all duration-200">
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
              确定要删除 “{initialTitle}” 吗？此操作无法撤销。
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
