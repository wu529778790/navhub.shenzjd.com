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
    <div className="relative min-h-screen overflow-x-clip">
      {/* 扁平·内容优先:背景交由 body 的极淡纸感渐变,此处不再叠加重彩色光斑 */}

      <AppHeader />

      <main className="flex flex-1 flex-col pb-8">{children}</main>
    </div>
  );
}
