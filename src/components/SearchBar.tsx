/**
 * 搜索栏组件 - 支持实时搜索和快捷键
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Keyboard, LayoutGrid, List } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = "搜索站点..." }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [showShortcutHint, setShowShortcutHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setShowShortcutHint(true);
        setTimeout(() => setShowShortcutHint(false), 1800);
      }

      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        setQuery("");
        onSearch("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 260);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery("");
    onSearch("");
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full" role="search">
      <div className="group relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="search-input w-full border-[var(--input-border)] bg-[var(--background-secondary)] pl-11 pr-24"
          aria-label="搜索站点"
          aria-describedby="search-description"
          autoComplete="off"
        />

        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] transition-colors group-focus-within:text-[var(--primary-600)]" aria-hidden="true">
          <Search className="h-5 w-5" />
        </div>

        {query ? (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            aria-label="清除搜索"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted-foreground)]" aria-hidden="true">
            <span className="kbd">Ctrl</span>
            <span className="mx-1">+</span>
            <span className="kbd">K</span>
          </div>
        )}
      </div>

      {showShortcutHint && (
        <div className="absolute -bottom-10 left-0 right-0 text-center" role="status" aria-live="polite">
          <div className="fade-in inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary-600)] px-3 py-1.5 text-sm text-white shadow-lg">
            <Keyboard className="h-4 w-4" />
            <span>搜索快捷键已激活</span>
          </div>
        </div>
      )}

      {query && (
        <div id="search-description" className="mt-2 flex items-center gap-2 text-xs text-[var(--foreground-secondary)]">
          <span className="inline-flex items-center gap-1">
            <span className="kbd">Esc</span>
            <span>清除搜索</span>
          </span>
        </div>
      )}
    </div>
  );
}

export function SearchStatus({
  query,
  resultsCount,
}: {
  query: string;
  resultsCount: number;
}) {
  if (!query) return null;

  return (
    <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-2 text-sm text-[var(--foreground-secondary)]">
      <Search className="h-4 w-4 text-[var(--primary-600)]" />
      <span>
        找到 <strong className="text-[var(--primary-700)]">{resultsCount}</strong> 个结果
      </span>
      <span className="text-[var(--muted-foreground)]">for &quot;{query}&quot;</span>
    </div>
  );
}

export function CategoryFilter() {
  return null;
}

export function ViewToggle({
  view,
  onViewChange,
}: {
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-secondary)] p-1 shadow-sm">
      <button
        onClick={() => onViewChange("grid")}
        className={`rounded-[var(--radius-sm)] p-2 transition-all duration-200 cursor-pointer ${
          view === "grid"
            ? "bg-[var(--primary-600)] text-white shadow"
            : "text-[var(--foreground-secondary)] hover:bg-[var(--muted)]"
        }`}
        aria-label="网格视图"
        title="网格视图"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        onClick={() => onViewChange("list")}
        className={`rounded-[var(--radius-sm)] p-2 transition-all duration-200 cursor-pointer ${
          view === "list"
            ? "bg-[var(--primary-600)] text-white shadow"
            : "text-[var(--foreground-secondary)] hover:bg-[var(--muted)]"
        }`}
        aria-label="列表视图"
        title="列表视图"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}
