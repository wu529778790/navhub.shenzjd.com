import { useState, useEffect } from "react";
import type { Category } from "@/lib/storage/local-storage";

/**
 * 监听各分类区域的可见性,返回当前处于视口中的分类 id。
 * 供桌面浮动侧边栏与移动端 chip 栏共享,保持高亮一致。
 */
export function useActiveCategory(categories: Category[]): string {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace("category-", "");
            setActiveId(id);
            break;
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    categories.forEach((cat) => {
      const el = document.getElementById(`category-${cat.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [categories]);

  return activeId;
}
