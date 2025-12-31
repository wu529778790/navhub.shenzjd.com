/**
 * 底部导航组件
 */

"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, FolderGit2, Settings as SettingsIcon } from "lucide-react";

const navItems = [
  { label: "首页", icon: Home, path: "/" },
  { label: "分类", icon: FolderGit2, path: "/categories" },
  { label: "设置", icon: SettingsIcon, path: "/settings" },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="sticky bottom-0 z-40 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800">
      <div className="container h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? "text-primary-600 bg-primary-50 dark:bg-primary-900/20"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
