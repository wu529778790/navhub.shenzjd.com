/**
 * 用户菜单（下拉）
 * 显示用户信息和操作按钮
 */

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { LogOut, Settings, ChevronDown } from "lucide-react";
import type { AuthUser, RuntimePublicConfig } from "@/types";

interface UserMenuProps {
  /** 用户信息 */
  authUser: AuthUser | null;
  /** 打开设置弹窗的回调 */
  onOpenSettings: () => void;
  /** 退出登录的回调 */
  onLogout: () => void;
  /** 运行时配置 */
  runtimeConfig: RuntimePublicConfig | null;
}

export function UserMenu({ authUser, onOpenSettings, onLogout }: UserMenuProps) {
  const [showMenu, setShowMenu] = useState(false);

  // 点击外部关闭菜单
  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".user-menu-container")) {
        setShowMenu(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showMenu]);

  // 未登录时返回 null，由父组件显示登录按钮
  if (!authUser) return null;

  return (
    <div className="user-menu-container relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-secondary)] px-2.5 py-1.5 transition-colors hover:border-[var(--primary-300)]"
        aria-haspopup="true"
        aria-expanded={showMenu}
      >
        <Image
          src={authUser.avatar}
          alt={authUser.name}
          className="h-7 w-7 rounded-[var(--radius-sm)]"
          width={28}
          height={28}
        />
        <ChevronDown
          className={`h-4 w-4 text-[var(--foreground-secondary)] transition-transform ${showMenu ? "rotate-180" : ""}`}
        />
      </button>

      {showMenu && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-secondary)] shadow-[var(--shadow-lg)]"
          role="menu"
          aria-label="用户操作菜单"
        >
          <div className="border-b border-[var(--border)] bg-[var(--muted)]/70 px-4 py-3">
            <div className="text-sm font-semibold text-[var(--foreground)]">{authUser.name}</div>
            <div className="mt-0.5 text-xs text-[var(--muted-foreground)]">已登录</div>
          </div>
          <button
            onClick={() => {
              onOpenSettings();
              setShowMenu(false);
            }}
            className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm text-[var(--foreground-secondary)] transition-colors hover:bg-[var(--muted)]"
            role="menuitem"
          >
            <Settings className="h-4 w-4" />
            设置
          </button>
          <button
            onClick={() => {
              onLogout();
              setShowMenu(false);
            }}
            className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm text-[var(--error)] transition-colors hover:bg-[var(--error)]/10"
            role="menuitem"
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}
