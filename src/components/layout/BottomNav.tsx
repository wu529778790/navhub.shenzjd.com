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

  const handleClick = (item: (typeof navItems)[0]) => {
    if (item.path === "/settings") {
      // 触发设置弹窗事件
      window.dispatchEvent(new Event('open-settings'));
    } else {
      router.push(item.path);
    }
  };

  return (
    <div className="sticky bottom-0 z-40 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800">
      <div className="container h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path === "/settings" && pathname === "/settings");
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => handleClick(item)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
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
