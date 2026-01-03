/**
 * 添加分类对话框
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface AddCategoryDialogProps {
  onClose: () => void;
  onConfirm: (name: string) => void;
}

export function AddCategoryDialog({ onClose, onConfirm }: AddCategoryDialogProps) {
  const [name, setName] = useState("");

  const handleConfirm = () => {
    if (!name.trim()) {
      return;
    }
    onConfirm(name);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加分类</DialogTitle>
          <DialogDescription>创建一个新的分类来组织你的链接</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Input
            placeholder="输入分类名称（如：工作、学习、娱乐）"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConfirm();
              if (e.key === "Escape") onClose();
            }}
            autoFocus
            className="h-11 text-base"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="min-w-20">
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={!name.trim()} className="min-w-20">
            确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
