/**
 * 应用布局组件
 */

"use client";

import { ReactNode } from "react";
import { AppHeader } from "./AppHeader";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      <AppHeader />

      {/* 主内容 */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
