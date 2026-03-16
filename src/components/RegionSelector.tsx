"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  REGIONS,
  DEFAULT_REGIONS,
  getRegionsByGroup,
  getRegionName,
  type RegionGroup,
} from "@/lib/regions";
import { useLocale } from "@/lib/i18n";

interface RegionSelectorProps {
  selectedCodes: string[];
  onChange: (codes: string[]) => void;
  maxSelections?: number;
}

export default function RegionSelector({
  selectedCodes,
  onChange,
  maxSelections = 15,
}: RegionSelectorProps) {
  const { locale, t } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const grouped = useMemo(() => getRegionsByGroup(), []);

  // 搜索过滤
  const filteredGrouped = useMemo(() => {
    if (!search.trim()) return grouped;
    const q = search.trim().toLowerCase();
    const result: Record<RegionGroup, typeof REGIONS> = {
      "asia-pacific": [],
      europe: [],
      americas: [],
      "middle-east-africa": [],
    };
    for (const [group, regions] of Object.entries(grouped)) {
      result[group as RegionGroup] = regions.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.nameEn.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q) ||
          r.nameOriginal.toLowerCase().includes(q) ||
          r.nameJa.includes(q) ||
          r.nameKo.includes(q)
      );
    }
    return result;
  }, [grouped, search]);

  const isAtLimit = selectedCodes.length >= maxSelections;

  const toggleRegion = (code: string) => {
    if (selectedCodes.includes(code)) {
      onChange(selectedCodes.filter((c) => c !== code));
    } else if (!isAtLimit) {
      onChange([...selectedCodes, code]);
    }
  };

  const selectedRegions = REGIONS.filter((r) =>
    selectedCodes.includes(r.code)
  );

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto mt-4">
      {/* 触发区 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border text-left transition-all duration-200"
        style={{
          background: "var(--color-surface)",
          borderColor: isOpen ? "var(--color-accent)" : "var(--color-border)",
          boxShadow: isOpen ? "0 0 0 3px rgba(10, 132, 255, 0.15)" : "none",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--color-text-secondary)", flexShrink: 0 }}
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span
          className="text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {t("region.selected", { count: selectedCodes.length })}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="ml-auto transition-transform duration-200"
          style={{
            color: "var(--color-text-secondary)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* 已选地区标签 */}
      {selectedRegions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedRegions.map((r) => (
            <span
              key={r.code}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
            >
              {r.flag} {getRegionName(r, locale)}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRegion(r.code);
                }}
                className="ml-0.5 hover:opacity-70"
                style={{ color: "var(--color-text-secondary)" }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 下拉面板 */}
      {isOpen && (
        <div
          className="absolute z-40 w-full mt-2 rounded-xl border overflow-hidden"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
          }}
        >
          {/* 搜索框 */}
          <div
            className="px-3 py-2 border-b"
            style={{ borderColor: "var(--color-border)" }}
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("region.search_placeholder")}
              className="w-full bg-transparent outline-none text-sm"
              style={{ color: "var(--color-text)" }}
              autoFocus
            />
          </div>

          {/* 分组列表 */}
          <div className="max-h-72 overflow-y-auto">
            {(
              (["asia-pacific", "europe", "americas", "middle-east-africa"] as RegionGroup[])
            ).map((group) => {
              const regions = filteredGrouped[group];
              if (regions.length === 0) return null;
              return (
                <div key={group}>
                  <div
                    className="px-3 py-1.5 text-xs font-medium sticky top-0"
                    style={{
                      background: "var(--color-surface)",
                      color: "var(--color-text-secondary)",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    {t(`group.${group}`)}
                  </div>
                  {regions.map((r) => {
                    const isSelected = selectedCodes.includes(r.code);
                    const isDisabled = !isSelected && isAtLimit;
                    return (
                      <label
                        key={r.code}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer transition-colors duration-100 ${
                          isDisabled
                            ? "opacity-40 cursor-not-allowed"
                            : "hover:bg-[var(--color-surface-hover)]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isDisabled}
                          onChange={() => toggleRegion(r.code)}
                          className="accent-[var(--color-accent)]"
                        />
                        <span>{r.flag}</span>
                        <span style={{ color: "var(--color-text)" }}>
                          {getRegionName(r, locale)}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {locale === "en" ? r.name : r.nameEn}
                        </span>
                      </label>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* 底部操作 */}
          <div
            className="flex items-center justify-between px-3 py-2 border-t text-xs"
            style={{ borderColor: "var(--color-border)" }}
          >
            <span style={{ color: "var(--color-text-secondary)" }}>
              {selectedCodes.length}/{maxSelections}
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => onChange([])}
                className="hover:opacity-70"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {t("region.clear_all")}
              </button>
              <button
                onClick={() => onChange([...DEFAULT_REGIONS])}
                style={{ color: "var(--color-accent)" }}
                className="hover:opacity-70"
              >
                {t("region.reset_default")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
