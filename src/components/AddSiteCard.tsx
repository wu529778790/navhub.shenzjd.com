/**
 * 添加站点卡片组件
 */

"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { AddSiteDialog } from "./AddSiteDialog";

interface AddSiteCardProps {
  activeCategory: string;
  onSuccess: () => void;
}

export function AddSiteCard({ activeCategory, onSuccess }: AddSiteCardProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setIsAddDialogOpen(true)}
        className="flex flex-col items-center gap-2 cursor-pointer group w-[80px]"
      >
        <div className="w-12 h-12 relative flex items-center justify-center rounded-xl overflow-hidden bg-white shadow-sm group-hover:shadow-md transition-all duration-200">
          <Plus className="w-6 h-6 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </div>
        <span className="text-xs text-center text-gray-600 truncate w-full">
          添加网站
        </span>
      </div>

      <AddSiteDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        activeCategory={activeCategory}
        onSuccess={onSuccess}
      />
    </>
  );
}
