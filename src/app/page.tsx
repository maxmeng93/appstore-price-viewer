"use client";

import { useState, useEffect, useRef } from "react";
import SearchBar from "@/components/SearchBar";
import RegionSelector from "@/components/RegionSelector";
import PriceTable from "@/components/PriceTable";
import { DEFAULT_REGIONS } from "@/lib/regions";
import { detectLocale, LocaleContext, t, LOCALE_LABELS, type Locale } from "@/lib/i18n";
import type { AppInfo, RegionPrice, AppViewCount } from "@/lib/types";

const STORAGE_KEY = "selectedRegions";

export default function Home() {
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);
  const [prices, setPrices] = useState<RegionPrice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(DEFAULT_REGIONS);
  const [locale, setLocale] = useState<Locale>("en");
  const [showUSD, setShowUSD] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);
  const [popularApps, setPopularApps] = useState<AppViewCount[]>([]);
  const initializedRef = useRef(false);

  // 检测语言（优先 sessionStorage）+ 从 localStorage 恢复地区选择 + 读取 URL 中的 trackId
  useEffect(() => {
    const saved = sessionStorage.getItem("appLocale") as Locale | null;
    const initial = (saved && saved in LOCALE_LABELS) ? saved : detectLocale();
    setLocale(initial);
    document.documentElement.lang = initial;
    let regions = DEFAULT_REGIONS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          regions = parsed;
          setSelectedRegions(parsed);
        }
      }
    } catch {}
    initializedRef.current = true;

    // 获取热门 App 列表
    fetch("/api/popular?limit=20")
      .then((res) => res.json())
      .then((data) => {
        if (data.apps) setPopularApps(data.apps);
      })
      .catch((err) => console.error("Failed to fetch popular apps:", err));

    // 从 URL 读取 trackId，自动加载价格数据
    const urlParams = new URLSearchParams(window.location.search);
    const trackId = urlParams.get("id");
    if (trackId) {
      // 尝试从 sessionStorage 恢复缓存的 AppInfo
      let cachedApp: AppInfo | null = null;
      try {
        const cached = sessionStorage.getItem(`appInfo_${trackId}`);
        if (cached) cachedApp = JSON.parse(cached);
      } catch {}

      let url = `/api/prices?trackId=${trackId}&regions=${regions.join(",")}`;
      if (cachedApp) {
        url += `&trackName=${encodeURIComponent(cachedApp.trackName)}&artworkUrl512=${encodeURIComponent(cachedApp.artworkUrl512)}`;
      }

      setIsLoading(true);
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (!data.error && data.app) {
            setSelectedApp(data.app);
            setPrices(data.prices || []);
          }
        })
        .catch((err) => console.error("Failed to load app from URL:", err))
        .finally(() => setIsLoading(false));
    }
  }, []);

  // 切换语言
  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    sessionStorage.setItem("appLocale", newLocale);
    document.documentElement.lang = newLocale;
  };

  const handleRegionsChange = (codes: string[]) => {
    setSelectedRegions(codes);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
    } catch {}
  };

  const fetchPrices = async (app: AppInfo, regions: string[]) => {
    setPrices([]);
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/prices?trackId=${app.trackId}&regions=${regions.join(",")}&trackName=${encodeURIComponent(app.trackName)}&artworkUrl512=${encodeURIComponent(app.artworkUrl512)}`
      );
      const data = await res.json();
      if (data.error) {
        console.error(data.error);
        return;
      }
      setSelectedApp(data.app || app);
      setPrices(data.prices || []);
    } catch (err) {
      console.error("Failed to fetch prices:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectApp = (app: AppInfo) => {
    setSelectedApp(app);
    // 缓存到 sessionStorage，页面刷新时可恢复
    try {
      sessionStorage.setItem(`appInfo_${app.trackId}`, JSON.stringify(app));
    } catch {}
    fetchPrices(app, selectedRegions);
    // 将 trackId 写入 URL，支持分享链接
    const url = new URL(window.location.href);
    url.searchParams.set("id", String(app.trackId));
    window.history.replaceState({}, "", url.toString());
  };

  // USD 开关开启时获取汇率
  const handleToggleUSD = (value: boolean) => {
    setShowUSD(value);
    if (value && !exchangeRates) {
      fetch("/api/exchange-rates")
        .then((res) => res.json())
        .then((data) => {
          if (data.rates) setExchangeRates(data.rates);
        })
        .catch((err) => console.error("Failed to fetch exchange rates:", err));
    }
  };

  // 地区变化时，如果已有选中 App，自动重新查询
  const prevRegionsRef = useRef(selectedRegions);
  useEffect(() => {
    if (!initializedRef.current) return;
    if (
      selectedApp &&
      JSON.stringify(prevRegionsRef.current) !== JSON.stringify(selectedRegions)
    ) {
      fetchPrices(selectedApp, selectedRegions);
    }
    prevRegionsRef.current = selectedRegions;
  }, [selectedRegions, selectedApp]);

  const fallbackApps: Record<Locale, string[]> = {
    zh: ["微信", "Notion", "Procreate", "1Password", "Bear"],
    en: ["WhatsApp", "Notion", "Procreate", "1Password", "Bear"],
    ja: ["LINE", "Notion", "Procreate", "1Password", "Bear"],
    ko: ["KakaoTalk", "Notion", "Procreate", "1Password", "Bear"],
    ru: ["Telegram", "Notion", "Procreate", "1Password", "Bear"],
  };

  type SuggestedItem =
    | { type: "popular"; app: AppViewCount }
    | { type: "fallback"; name: string };

  const getSuggestedApps = (): SuggestedItem[] => {
    if (popularApps.length >= 5) {
      const top2 = popularApps.slice(0, 2);
      const rest = popularApps.slice(2);
      const shuffled = [...rest].sort(() => Math.random() - 0.5);
      const random3 = shuffled.slice(0, 3);
      return [...top2, ...random3].map((app) => ({ type: "popular", app }));
    }
    if (popularApps.length > 0) {
      const items: SuggestedItem[] = popularApps.map((app) => ({ type: "popular", app }));
      const usedNames = new Set(popularApps.map((a) => a.trackName));
      for (const name of fallbackApps[locale]) {
        if (items.length >= 5) break;
        if (!usedNames.has(name)) items.push({ type: "fallback", name });
      }
      return items;
    }
    return fallbackApps[locale].map((name) => ({ type: "fallback", name }));
  };

  return (
    <LocaleContext.Provider value={locale}>
    {/* 语言切换控件 + GitHub 链接 */}
    <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
      {/* GitHub 链接 */}
      <a
        href="https://github.com/maxmeng93/app-store-price-viewer"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-150"
        style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-secondary)" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-text)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-secondary)"; }}
      >
        <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
      </a>
      {/* 语言切换按钮组 */}
      <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
        {(Object.keys(LOCALE_LABELS) as Locale[]).map((loc) => (
          <button
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className="px-3 py-1.5 text-sm font-medium transition-colors duration-150"
            style={{
              background: locale === loc ? "var(--color-accent)" : "transparent",
              color: locale === loc ? "#fff" : "var(--color-text-secondary)",
            }}
          >
            {LOCALE_LABELS[loc]}
          </button>
        ))}
      </div>
    </div>
    <main className="min-h-screen px-4 py-16 md:py-24">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{
              background: "linear-gradient(135deg, #0a84ff, #5e5ce6)",
              boxShadow: "0 4px 16px rgba(10, 132, 255, 0.3)",
            }}
          >
            💰
          </div>
        </div>
        <h1
          className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
          style={{
            background: "linear-gradient(135deg, #e8e8ed 0%, #8888a0 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          App Store Price Viewer
        </h1>
        <p className="text-lg" style={{ color: "var(--color-text-secondary)" }}>
          {t(locale, "subtitle")}
        </p>
      </div>

      {/* 搜索栏 */}
      <SearchBar onSelect={handleSelectApp} />

      {/* 地区选择器 */}
      <RegionSelector
        selectedCodes={selectedRegions}
        onChange={handleRegionsChange}
      />

      {/* 价格表格 */}
      {(isLoading || selectedApp) && (
        <PriceTable
          app={selectedApp!}
          prices={prices}
          isLoading={isLoading}
          showUSD={showUSD}
          exchangeRates={exchangeRates}
          onToggleUSD={handleToggleUSD}
        />
      )}

      {/* Empty state */}
      {!selectedApp && !isLoading && (
        <div className="text-center mt-20">
          <div className="text-6xl mb-6 opacity-30">🔍</div>
          <p style={{ color: "var(--color-text-secondary)" }}>
            {t(locale, "empty.hint")}
          </p>
          <div
            className="flex flex-wrap justify-center gap-2 mt-6 max-w-lg mx-auto"
          >
            {getSuggestedApps().map((item) =>
              item.type === "popular" ? (
                <button
                  key={item.app.trackId}
                  onClick={() =>
                    handleSelectApp({
                      trackId: item.app.trackId,
                      trackName: item.app.trackName,
                      artworkUrl512: item.app.artworkUrl512,
                      bundleId: "",
                      sellerName: "",
                      primaryGenreName: "",
                      price: 0,
                      currency: "USD",
                      formattedPrice: "",
                    })
                  }
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors duration-150"
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-accent)";
                    e.currentTarget.style.color = "var(--color-accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-border)";
                    e.currentTarget.style.color = "var(--color-text-secondary)";
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.app.artworkUrl512}
                    alt={item.app.trackName}
                    width={16}
                    height={16}
                    className="rounded"
                  />
                  {item.app.trackName}
                </button>
              ) : (
                <button
                  key={item.name}
                  onClick={() => {
                    const input = document.querySelector("input");
                    if (input) {
                      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                        window.HTMLInputElement.prototype,
                        "value"
                      )?.set;
                      nativeInputValueSetter?.call(input, item.name);
                      input.dispatchEvent(new Event("input", { bubbles: true }));
                      input.dispatchEvent(new Event("change", { bubbles: true }));
                    }
                  }}
                  className="px-4 py-2 rounded-full text-sm transition-colors duration-150"
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-accent)";
                    e.currentTarget.style.color = "var(--color-accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-border)";
                    e.currentTarget.style.color = "var(--color-text-secondary)";
                  }}
                >
                  {item.name}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </main>
    </LocaleContext.Provider>
  );
}
