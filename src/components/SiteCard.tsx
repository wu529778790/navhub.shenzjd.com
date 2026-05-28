/**
 * 站点卡片组件 - 现代化设计
 * - 正常点击：打开链接
 * - 右键/长按：显示编辑菜单
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { useSites } from "@/contexts/SitesContext";
import { cn } from "@/lib/utils";
import { FaviconImage } from "@/components/FaviconImage";
import { EditSiteDialog } from "@/components/EditSiteDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
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
  onSiteChange?: () => void;
  view?: "grid" | "list";
}

export function SiteCard({
  id,
  title: initialTitle,
  url,
  favicon = "",
  categoryId,
  onSiteChange,
  view = "grid",
}: SiteCardProps) {
  const { updateSite, deleteSite, isGuestMode } = useSites();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isContextMenuOpen) return;
    document.body.style.overflow = "hidden";

    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setIsContextMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isContextMenuOpen]);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  // Use native event listener to reliably prevent browser context menu
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const handler = (e: Event) => {
      if (isGuestMode) return;
      e.preventDefault();
      setIsContextMenuOpen(true);
    };
    el.addEventListener("contextmenu", handler);
    return () => el.removeEventListener("contextmenu", handler);
  }, [isGuestMode]);

  const getDomain = () => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const handleEdit = async (data: { title: string; url: string; favicon: string }) => {
    await updateSite(categoryId, id, { id, ...data });
    onSiteChange?.();
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await deleteSite(categoryId, id);
      setIsDeleteAlertOpen(false);
      onSiteChange?.();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isContextMenuOpen) {
      setIsContextMenuOpen(false);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSecondaryPointerCapture = (e: React.MouseEvent | React.PointerEvent) => {
    if (e.button !== 2) return;
    e.stopPropagation();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isGuestMode) return;
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    longPressTimer.current = setTimeout(() => {
      setIsContextMenuOpen(true);
      if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
      if (cardRef.current) {
        cardRef.current.style.transform = "scale(0.98)";
        setTimeout(() => {
          if (cardRef.current) cardRef.current.style.transform = "";
        }, 150);
      }
    }, 450);
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
      if (deltaX > 10 || deltaY > 10) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
        touchStartPos.current = null;
      }
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditDialogOpen(true);
    setIsContextMenuOpen(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteAlertOpen(true);
    setIsContextMenuOpen(false);
  };

  const contextMenu = !isGuestMode && isContextMenuOpen && (
    <div
      ref={contextMenuRef}
      role="menu"
      aria-label="站点操作菜单"
      className={cn(
        "absolute z-[9999] w-auto",
        view === "grid" ? "top-full mt-2 left-0" : "left-4 top-1/2 -translate-y-1/2",
        "bg-[var(--background-secondary)]/95 backdrop-blur-xl",
        "border border-[var(--border)] rounded-[var(--radius-xl)]",
        "shadow-[0_16px_36px_-14px_rgba(8,41,50,0.35)]",
        "p-1.5 animate-in fade-in zoom-in-95",
        "overflow-hidden"
      )}
    >
      <button
        role="menuitem"
        onClick={handleEditClick}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)]",
          "hover:bg-[var(--primary-50)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)]",
          "text-sm font-medium transition-all active:scale-95",
          "group relative overflow-hidden whitespace-nowrap cursor-pointer"
        )}
        aria-label={`编辑 ${initialTitle}`}
      >
        <div
          className={cn(
            "w-6 h-6 rounded-md bg-[var(--primary-100)] flex items-center justify-center",
            "group-hover:bg-[var(--primary-200)] transition-colors"
          )}
        >
          <Pencil className="w-3.5 h-3.5 text-[var(--primary-600)] group-hover:scale-110 transition-transform" />
        </div>
        <span>编辑站点</span>
      </button>
      <button
        role="menuitem"
        onClick={handleDeleteClick}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)]",
          "hover:bg-[var(--error)]/10 text-[var(--error)]",
          "text-sm font-medium transition-all active:scale-95 mt-0.5",
          "group relative overflow-hidden whitespace-nowrap cursor-pointer"
        )}
        aria-label={`删除 ${initialTitle}`}
      >
        <div
          className={cn(
            "w-6 h-6 rounded-md bg-[var(--error)]/10 flex items-center justify-center",
            "group-hover:bg-[var(--error)]/20 transition-colors"
          )}
        >
          <Trash2 className="w-3.5 h-3.5 text-[var(--error)] group-hover:scale-110 transition-transform" />
        </div>
        <span>删除站点</span>
      </button>
    </div>
  );

  const deleteDialog = (
    <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
      <AlertDialogContent className="sm:max-w-md bg-[var(--background)]/95 backdrop-blur-2xl border border-[var(--border)] rounded-[var(--radius-2xl)] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)] p-6">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-[var(--error)]/10 flex items-center justify-center border border-[var(--error)]/20">
              <Trash2 className="w-5 h-5 text-[var(--error)]" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold text-[var(--foreground)]">
              确认删除站点
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-[var(--foreground-secondary)] text-base leading-relaxed mt-2">
            确定要删除 <strong className="text-[var(--error)] font-semibold">{initialTitle}</strong>{" "}
            吗？
            <br />
            <span className="text-sm text-[var(--muted-foreground)] mt-1 inline-block">
              此操作无法撤销，数据将从本地和 GitHub 同步删除。
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 pt-4 mt-4 border-t border-[var(--border)] w-full">
          <AlertDialogCancel
            className={cn(
              "flex-1 h-12 rounded-[var(--radius-xl)] text-base font-medium",
              "bg-[var(--background)] border border-[var(--border)]",
              "hover:bg-[var(--background-secondary)] hover:border-[var(--border-strong)]",
              "transition-all duration-200 active:scale-95"
            )}
          >
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
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100"
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

  const cardEvents = {
    onClick: handleCardClick,
    onPointerDownCapture: handleSecondaryPointerCapture,
    onMouseDownCapture: handleSecondaryPointerCapture,
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchMove: handleTouchMove,
  };

  if (view === "grid") {
    return (
      <>
        <div
          ref={cardRef}
          key={id}
          role="button"
          tabIndex={0}
          aria-label={`${initialTitle} - 点击打开链接${!isGuestMode ? "，按 Enter 或 Space 显示菜单" : ""}`}
          aria-haspopup={!isGuestMode}
          aria-expanded={isContextMenuOpen}
          {...cardEvents}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !isGuestMode) {
              e.preventDefault();
              setIsContextMenuOpen(!isContextMenuOpen);
            }
          }}
          className={cn(
            "site-card group cursor-pointer bg-[var(--background-secondary)]/85",
            isContextMenuOpen && "z-[9999]"
          )}
          title={isGuestMode ? "点击打开链接" : "点击打开链接，按 Enter 显示菜单"}
        >
          <div className="site-icon-wrapper">
            <FaviconImage
              key={`grid-${id}-${favicon || "none"}`}
              src={favicon}
              alt={initialTitle}
              fill
              imageClassName="object-contain p-[1px]"
              fallbackClassName="bg-gradient-to-br from-[var(--primary-100)] to-[var(--primary-50)] text-[var(--primary-700)]"
              iconClassName="w-4 h-4"
            />
          </div>
          <span className="site-title transition-colors group-hover:text-[var(--primary-700)]">
            {initialTitle}
          </span>
          {contextMenu}
        </div>
        <EditSiteDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          initialTitle={initialTitle}
          initialUrl={url}
          initialFavicon={favicon}
          onSave={handleEdit}
        />
        {deleteDialog}
      </>
    );
  }

  return (
    <>
      <div
        ref={cardRef}
        key={id}
        {...cardEvents}
        className={cn(
          "relative flex items-center gap-3 p-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-secondary)]/90 transition-all duration-200 hover:shadow-md hover:border-[var(--primary-300)] hover:translate-x-1 cursor-pointer",
          isContextMenuOpen && "z-[9999]"
        )}
        title={isGuestMode ? "点击打开链接" : "点击打开链接，右键或长按显示菜单"}
      >
        <div className="site-icon-wrapper w-10 h-10 flex-shrink-0">
          <FaviconImage
            key={`list-${id}-${favicon || "none"}`}
            src={favicon}
            alt={initialTitle}
            fill
            imageClassName="object-contain p-0.5"
            fallbackClassName="bg-gradient-to-br from-[var(--primary-100)] to-[var(--primary-50)] text-[var(--primary-700)]"
            iconClassName="w-4 h-4"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[var(--foreground)] truncate">{initialTitle}</div>
          <div className="text-xs text-[var(--foreground-secondary)] truncate flex items-center gap-1">
            <Globe className="w-3 h-3" />
            {getDomain()}
          </div>
        </div>
        {contextMenu}
      </div>
      <EditSiteDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        initialTitle={initialTitle}
        initialUrl={url}
        initialFavicon={favicon}
        onSave={handleEdit}
      />
      {deleteDialog}
    </>
  );
}
