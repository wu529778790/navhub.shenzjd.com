/**
 * 导入导出对话框组件
 */

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSites } from "@/contexts/SitesContext";
import {
  exportToJSON,
  exportToOPML,
  importFromJSON,
  importFromBookmarks,
  downloadFile,
  readFile,
} from "@/lib/utils/import-export";
import { loadFromLocalStorage } from "@/lib/storage/local-storage";
import { Download, Upload, FileJson, FileText, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportExportDialog({ open, onOpenChange }: ImportExportDialogProps) {
  const { updateSites, sites } = useSites();
  const { showToast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // 导出为 JSON
  const handleExportJSON = () => {
    try {
      const data = loadFromLocalStorage();
      if (!data) {
        showToast("没有数据可导出", "warning");
        return;
      }

      const jsonString = exportToJSON(data);
      const filename = `navhub-export-${new Date().toISOString().split("T")[0]}.json`;
      downloadFile(jsonString, filename, "application/json");
      showToast("导出成功", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "导出失败", "error");
    }
  };

  // 导出为 OPML
  const handleExportOPML = () => {
    try {
      const data = loadFromLocalStorage();
      if (!data) {
        showToast("没有数据可导出", "warning");
        return;
      }

      const opmlString = exportToOPML(data);
      const filename = `navhub-export-${new Date().toISOString().split("T")[0]}.opml`;
      downloadFile(opmlString, filename, "application/xml");
      showToast("导出成功", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "导出失败", "error");
    }
  };

  // 从 JSON 导入
  const handleImportJSON = async (file: File) => {
    setIsImporting(true);
    setImportError(null);

    try {
      const content = await readFile(file);
      const data = importFromJSON(content);
      await updateSites(data.categories);
      showToast("导入成功", "success");
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "导入失败";
      setImportError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsImporting(false);
    }
  };

  // 从书签导入
  const handleImportBookmarks = async (file: File) => {
    setIsImporting(true);
    setImportError(null);

    try {
      const content = await readFile(file);
      const data = importFromBookmarks(content);
      if (data.categories.length === 0 || data.categories[0].sites.length === 0) {
        throw new Error("未找到有效的书签数据");
      }
      await updateSites(data.categories);
      showToast("导入成功", "success");
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "导入失败";
      setImportError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>导入/导出数据</DialogTitle>
          <DialogDescription>备份或恢复你的导航数据</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 导出部分 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-[var(--foreground-secondary)] flex items-center gap-2">
              <Download className="w-4 h-4" />
              导出数据
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleExportJSON}
                variant="outline"
                className="gap-2"
                disabled={sites.length === 0}
              >
                <FileJson className="w-4 h-4" />
                JSON 格式
              </Button>
              <Button
                onClick={handleExportOPML}
                variant="outline"
                className="gap-2"
                disabled={sites.length === 0}
              >
                <FileText className="w-4 h-4" />
                OPML 格式
              </Button>
            </div>
          </div>

          {/* 导入部分 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-[var(--foreground-secondary)] flex items-center gap-2">
              <Upload className="w-4 h-4" />
              导入数据
            </h3>

            {importError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20">
                <AlertCircle className="w-4 h-4 text-[var(--error)] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[var(--error)]">{importError}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block">
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImportJSON(file);
                    }
                  }}
                  className="hidden"
                  disabled={isImporting}
                />
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  asChild
                  disabled={isImporting}
                >
                  <span>
                    <FileJson className="w-4 h-4" />
                    从 JSON 导入
                  </span>
                </Button>
              </label>

              <label className="block">
                <input
                  type="file"
                  accept=".html"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImportBookmarks(file);
                    }
                  }}
                  className="hidden"
                  disabled={isImporting}
                />
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  asChild
                  disabled={isImporting}
                >
                  <span>
                    <BookOpen className="w-4 h-4" />
                    从浏览器书签导入
                  </span>
                </Button>
              </label>
            </div>

            {isImporting && (
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <div className="w-4 h-4 border-2 border-[var(--primary-600)] border-t-transparent rounded-full animate-spin" />
                正在导入...
              </div>
            )}
          </div>

          {/* 提示信息 */}
          <div className="p-3 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-xs text-[var(--muted-foreground)]">
            <p className="font-medium mb-1">提示：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>导出数据会包含所有分类和站点</li>
              <li>导入数据会替换当前所有数据</li>
              <li>建议在导入前先导出备份</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
