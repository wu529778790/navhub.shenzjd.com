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
import { Download, Upload, FileJson, FileText, BookOpen, AlertCircle, Loader2 } from "lucide-react";
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">导入/导出数据</DialogTitle>
          <DialogDescription>备份、迁移或恢复你的导航数据</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <section className="card space-y-3 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground-secondary)]">
              <Download className="h-4 w-4 text-[var(--primary-700)]" />
              导出数据
            </h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button onClick={handleExportJSON} variant="outline" className="h-11 gap-2" disabled={sites.length === 0}>
                <FileJson className="h-4 w-4" />
                JSON 格式
              </Button>
              <Button onClick={handleExportOPML} variant="outline" className="h-11 gap-2" disabled={sites.length === 0}>
                <FileText className="h-4 w-4" />
                OPML 格式
              </Button>
            </div>
          </section>

          <section className="card space-y-3 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground-secondary)]">
              <Upload className="h-4 w-4 text-[var(--primary-700)]" />
              导入数据
            </h3>

            {importError && (
              <div className="flex items-start gap-2 rounded-[var(--radius-lg)] border border-[var(--error)]/25 bg-[var(--error)]/10 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--error)]" />
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
                <Button variant="outline" className="h-11 w-full justify-start gap-2" asChild disabled={isImporting}>
                  <span>
                    <FileJson className="h-4 w-4" />
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
                <Button variant="outline" className="h-11 w-full justify-start gap-2" asChild disabled={isImporting}>
                  <span>
                    <BookOpen className="h-4 w-4" />
                    从浏览器书签导入
                  </span>
                </Button>
              </label>
            </div>

            {isImporting && (
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--primary-600)]" />
                正在导入...
              </div>
            )}
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--warning)]/30 bg-[var(--warning)]/10 p-3 text-xs text-[var(--foreground-secondary)]">
            <p className="mb-1 font-semibold">提示</p>
            <p>导出会包含全部分类和站点。导入会替换当前数据，建议先导出备份。</p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
