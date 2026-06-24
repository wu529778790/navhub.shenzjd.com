/**
 * 站点卡片组件
 * - 点击：打开链接
 * - 三点菜单按钮：编辑/删除（悬停显示）
 */

"use client";

import { useState, useRef, useEffect, useMemo, memo } from "react";
import { useData } from "@/contexts/SitesContext";
import { useAuth } from "@/contexts/AuthContext";
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
import { Pencil, Trash2, Globe, MoreVertical } from "lucide-react";

interface SiteCardProps {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  categoryId: string;
  view?: "grid" | "list";
}

export const SiteCard = memo(function SiteCard({
  id,
  title: initialTitle,
  url,
  favicon = "",
  categoryId,
  view = "grid",
}: SiteCardProps) {
  const { updateSite, deleteSite } = useData();
  const { isGuestMode } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<"auto" | "flip-up">("auto");

  // 点击外部关闭菜单
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // 计算菜单位置（防止超出视口）
  useEffect(() => {
    if (!isMenuOpen || !menuRef.current) return;
    const menuRect = menuRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    if (menuRect.bottom > vh && menuRect.height < vh) {
      setMenuPosition("flip-up");
    }
  }, [isMenuOpen]);

  const domain = useMemo(() => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }, [url]);

  const handleEdit = async (data: { title: string; url: string; favicon: string }) => {
    await updateSite(categoryId, id, { id, ...data });
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await deleteSite(categoryId, id);
      setIsDeleteAlertOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // 如果点击的是菜单按钮或菜单内容，不打开链接
    if ((e.target as HTMLElement).closest("[data-menu-trigger]")) return;
    e.preventDefault();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditDialogOpen(true);
    setIsMenuOpen(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteAlertOpen(true);
    setIsMenuOpen(false);
  };

  const dropdownMenu = isMenuOpen && (
    <div
      ref={menuRef}
      role="menu"
      aria-label="站点操作菜单"
      className={cn(
        "absolute z-[70] w-36 overflow-hidden",
        menuPosition === "flip-up" ? "bottom-full mb-1 left-0" : "top-full mt-1 left-0",
        "border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--background-secondary)]",
        "shadow-[var(--shadow-lg)] py-1"
      )}
    >
      <button
        role="menuitem"
        onClick={handleEditClick}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
      >
        <Pencil className="w-4 h-4" />
        <span>编辑</span>
      </button>
      <button
        role="menuitem"
        onClick={handleDeleteClick}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors cursor-pointer"
      >
        <Trash2 className="w-4 h-4" />
        <span>删除</span>
      </button>
    </div>
  );

  const deleteDialog = (
    <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除站点</AlertDialogTitle>
          <AlertDialogDescription>
            确定要删除 <strong>{initialTitle}</strong> 吗？此操作无法撤销。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-2 pt-2">
          <AlertDialogCancel className="flex-1">取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="flex-1 bg-[var(--error)] text-white hover:bg-[var(--error)]/90"
          >
            {isLoading ? "删除中..." : "确认删除"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );

  // 网格视图
  if (view === "grid") {
    return (
      <>
        <div
          role="button"
          tabIndex={0}
          onClick={handleCardClick}
          className={cn("site-card group/card cursor-pointer", isMenuOpen && "z-[60] relative")}
          title="点击打开链接"
        >
          {/* 三点菜单按钮 — 仅 hover 当前卡片时显示，访客模式下隐藏 */}
          {!isGuestMode && (
          <div
            className={cn(
              "absolute top-1 right-1 z-10 transition-opacity duration-150",
              isMenuOpen ? "opacity-100" : "opacity-0 group-hover/card:opacity-100"
            )}
          >
            <button
              data-menu-trigger
              onClick={handleMenuToggle}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--muted)] cursor-pointer"
              aria-label="更多操作"
            >
              <MoreVertical className="w-4 h-4 text-[var(--foreground-secondary)]" />
            </button>
            {dropdownMenu}
          </div>
          )}

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
          <span className="site-title transition-colors group-hover/card:text-[var(--primary-700)]">
            {initialTitle}
          </span>
        </div>
        {isEditDialogOpen && (
          <EditSiteDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            initialTitle={initialTitle}
            initialUrl={url}
            initialFavicon={favicon}
            onSave={handleEdit}
          />
        )}
        {isDeleteAlertOpen && deleteDialog}
      </>
    );
  }

  // 列表视图
  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick(e as unknown as React.MouseEvent);
          }
        }}
        className={cn(
          "relative flex items-center gap-3 p-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-secondary)] transition-all duration-200 hover:border-[var(--primary-300)] hover:shadow-[var(--shadow-md)] cursor-pointer group/card",
          isMenuOpen && "z-[60]"
        )}
        title="点击打开链接"
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
            {domain}
          </div>
        </div>

        {/* 三点菜单按钮 — 仅 hover 当前卡片时显示，访客模式下隐藏 */}
        {!isGuestMode && (
        <div
          className={cn(
            "relative flex-shrink-0 transition-opacity duration-150",
            isMenuOpen ? "opacity-100" : "opacity-0 group-hover/card:opacity-100"
          )}
        >
          <button
            data-menu-trigger
            onClick={handleMenuToggle}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] transition-colors hover:bg-[var(--muted)] cursor-pointer"
            aria-label="更多操作"
          >
            <MoreVertical className="w-4 h-4 text-[var(--foreground-secondary)]" />
          </button>
          {dropdownMenu}
        </div>
        )}
      </div>
      {isEditDialogOpen && (
        <EditSiteDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          initialTitle={initialTitle}
          initialUrl={url}
          initialFavicon={favicon}
          onSave={handleEdit}
        />
      )}
      {isDeleteAlertOpen && deleteDialog}
    </>
  );
});
