/**
 * 搜索栏组件 - 支持实时搜索和快捷键
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Keyboard } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = "搜索站点..." }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [showShortcutHint, setShowShortcutHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 监听 Ctrl/Cmd + K 快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setShowShortcutHint(true);
        setTimeout(() => setShowShortcutHint(false), 2000);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 触发搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery("");
    onSearch("");
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full ">
      {/* 搜索输入框 */}
      <div className="relative group">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="search-input w-full pl-11 pr-10 py-3 bg-[var(--background)] border-[var(--border)] rounded-[var(--radius-lg)]
                     focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent
                     transition-all duration-200 shadow-sm"
        />

        {/* 搜索图标 */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] group-focus-within:text-[var(--primary-600)] transition-colors">
          <Search className="w-5 h-5" />
        </div>

        {/* 清除按钮 */}
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors"
            aria-label="清除搜索"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* 快捷键提示 - 右下角 */}
        {!query && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[var(--muted-foreground)] text-xs">
            <span className="kbd">Ctrl</span>
            <span>+</span>
            <span className="kbd">K</span>
          </div>
        )}
      </div>

      {/* 快捷键提示动画 */}
      {showShortcutHint && (
        <div className="absolute -bottom-10 left-0 right-0 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--primary-600)] text-white rounded-[var(--radius-md)] text-sm shadow-lg animate-in fade-in slide-in-from-top-2">
            <Keyboard className="w-4 h-4" />
            <span>搜索快捷键已激活</span>
          </div>
        </div>
      )}

      {/* 搜索结果提示 */}
      {query && (
        <div className="mt-2 text-xs text-[var(--foreground-secondary)] flex items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <span className="kbd">Enter</span>
            <span>跳转到第一个结果</span>
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * 搜索状态显示组件
 */
export function SearchStatus({
  query,
  resultsCount
}: {
  query: string;
  resultsCount: number;
}) {
  if (!query) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-[var(--foreground-secondary)] bg-[var(--background-secondary)] px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border)]">
      <Search className="w-4 h-4" />
      <span>
        找到 <strong className="text-[var(--primary-600)]">{resultsCount}</strong> 个结果
      </span>
      <span className="text-[var(--muted-foreground)]">for "{query}"</span>
    </div>
  );
}

/**
 * 过滤器组件 - 按分类过滤
 */
export function CategoryFilter({
  categories,
  activeCategory,
  onCategoryChange
}: {
  categories: Array<{ id: string; name: string; icon?: string }>;
  activeCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button
        onClick={() => onCategoryChange(null)}
        className={`px-3 py-1.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-200
                   ${!activeCategory
                     ? 'bg-[var(--primary-600)] text-white shadow-md'
                     : 'bg-[var(--background)] text-[var(--foreground-secondary)] border border-[var(--border)] hover:bg-[var(--muted)]'
                   }`}
      >
        全部
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id === activeCategory ? null : category.id)}
          className={`px-3 py-1.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-200 flex items-center gap-1
                     ${activeCategory === category.id
                       ? 'bg-[var(--primary-600)] text-white shadow-md'
                       : 'bg-[var(--background)] text-[var(--foreground-secondary)] border border-[var(--border)] hover:bg-[var(--muted)]'
                     }`}
        >
          {category.icon && <span>{category.icon}</span>}
          <span>{category.name}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * 视图切换器 - 切换不同的展示方式
 */
export function ViewToggle({
  view,
  onViewChange
}: {
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius-md)] p-1">
      <button
        onClick={() => onViewChange("grid")}
        className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-sm transition-all duration-200
                   ${view === "grid"
                     ? 'bg-[var(--primary-600)] text-white shadow-sm'
                     : 'text-[var(--foreground-secondary)] hover:bg-[var(--muted)]'
                   }`}
        aria-label="网格视图"
        title="网格视图"
      >
        <span className="font-mono">⊞</span>
      </button>
      <button
        onClick={() => onViewChange("list")}
        className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-sm transition-all duration-200
                   ${view === "list"
                     ? 'bg-[var(--primary-600)] text-white shadow-sm'
                     : 'text-[var(--foreground-secondary)] hover:bg-[var(--muted)]'
                   }`}
        aria-label="列表视图"
        title="列表视图"
      >
        <span className="font-mono">☰</span>
      </button>
    </div>
  );
}