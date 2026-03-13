"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { AppInfo } from "@/lib/types";

interface SearchBarProps {
  onSelect: (app: AppInfo) => void;
}

export default function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AppInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const doSearch = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?term=${encodeURIComponent(term)}`);
      const data = await res.json();
      setResults(data.results || []);
      setShowDropdown(true);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 400);
  };

  const handleSelect = (app: AppInfo) => {
    setQuery(app.trackName);
    setShowDropdown(false);
    onSelect(app);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <div
        className="flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all duration-200"
        style={{
          background: "var(--color-surface)",
          borderColor: showDropdown ? "var(--color-accent)" : "var(--color-border)",
          boxShadow: showDropdown ? "0 0 0 3px rgba(10, 132, 255, 0.15)" : "none",
        }}
      >
        {/* Search icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--color-text-secondary)", flexShrink: 0 }}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>

        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder="搜索 App 名称或 ID..."
          className="flex-1 bg-transparent outline-none text-base"
          style={{ color: "var(--color-text)" }}
        />

        {isLoading && (
          <div
            className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{
              borderColor: "var(--color-border)",
              borderTopColor: "var(--color-accent)",
            }}
          />
        )}
      </div>

      {/* 搜索结果下拉 */}
      {showDropdown && results.length > 0 && (
        <div
          className="absolute z-50 w-full mt-2 rounded-2xl border overflow-hidden"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
          }}
        >
          {results.map((app) => (
            <button
              key={app.trackId}
              onClick={() => handleSelect(app)}
              className="flex items-center gap-4 w-full px-5 py-3 text-left transition-colors duration-150 hover:bg-[var(--color-surface-hover)]"
            >
              <img
                src={app.artworkUrl512}
                alt={app.trackName}
                className="w-12 h-12 rounded-xl"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate" style={{ color: "var(--color-text)" }}>
                  {app.trackName}
                </div>
                <div className="text-sm truncate" style={{ color: "var(--color-text-secondary)" }}>
                  {app.sellerName} · {app.primaryGenreName}
                </div>
              </div>
              <div
                className="text-sm font-medium px-3 py-1 rounded-full"
                style={{
                  background: app.price === 0 ? "rgba(48, 209, 88, 0.12)" : "rgba(10, 132, 255, 0.12)",
                  color: app.price === 0 ? "var(--color-green)" : "var(--color-accent)",
                }}
              >
                {app.formattedPrice || "Free"}
              </div>
              <a
                href={`https://apps.apple.com/app/id${app.trackId}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="ml-2 p-1 rounded transition-colors"
                style={{ color: "var(--color-text-secondary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
                title="在 App Store 中查看"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
