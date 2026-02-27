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
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-[var(--primary-300)]/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-[var(--accent-500)]/15 blur-3xl" />
      </div>

      <AppHeader />

      <main className="flex flex-1 flex-col pb-8">{children}</main>
    </div>
  );
}
