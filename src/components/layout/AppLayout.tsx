/**
 * 应用布局组件
 */

"use client";

import { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function AppLayout({ children, showNav = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      <AppHeader />

      {/* 离线提示 */}
      {/* <OfflineBanner /> */}

      {/* 主内容 */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* 底部导航 */}
      {showNav && <BottomNav />}
    </div>
  );
}
