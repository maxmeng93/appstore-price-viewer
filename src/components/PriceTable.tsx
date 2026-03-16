"use client";

import type { AppInfo, RegionPrice } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import { getRegionName, getRegionByCode } from "@/lib/regions";
import { convertToUSD } from "@/lib/currency";

interface PriceTableProps {
  app: AppInfo;
  prices: RegionPrice[];
  isLoading: boolean;
  showUSD: boolean;
  exchangeRates: Record<string, number> | null;
  onToggleUSD: (value: boolean) => void;
}

export default function PriceTable({ app, prices, isLoading, showUSD, exchangeRates, onToggleUSD }: PriceTableProps) {
  const { locale, t } = useLocale();

  // USD 模式是否可用
  const usdActive = showUSD && exchangeRates;

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-8">
        {/* App info skeleton */}
        <div className="flex items-center gap-5 mb-8">
          <div className="skeleton w-20 h-20 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <div className="skeleton w-48 h-6" />
            <div className="skeleton w-32 h-4" />
          </div>
        </div>
        {/* Table skeleton */}
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton w-full h-14" />
          ))}
        </div>
      </div>
    );
  }

  if (!app || prices.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      {/* App 信息头 */}
      <div
        className="flex items-center gap-5 p-6 rounded-2xl mb-6"
        style={{ background: "var(--color-surface)" }}
      >
        <img
          src={app.artworkUrl512}
          alt={app.trackName}
          className="w-20 h-20 rounded-2xl"
          style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}
        />
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold truncate">{app.trackName}</h2>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            {app.sellerName} · {app.primaryGenreName}
          </p>
          {app.averageUserRating && (
            <div className="flex items-center gap-2 mt-2">
              <span style={{ color: "#ffd60a" }}>★</span>
              <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {app.averageUserRating.toFixed(1)}
                {app.userRatingCount && ` (${formatNumber(app.userRatingCount, locale)})`}
              </span>
            </div>
          )}
        </div>
        <div
          className="text-lg font-semibold px-4 py-2 rounded-xl"
          style={{
            background: "rgba(10, 132, 255, 0.12)",
            color: "var(--color-accent)",
          }}
        >
          ID: {app.trackId}
        </div>
      </div>

      {/* USD 开关 */}
      <div className="flex items-center justify-end gap-3 mb-4">
        <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {t("table.show_usd")}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={showUSD}
          onClick={() => onToggleUSD(!showUSD)}
          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
          style={{
            background: showUSD ? "var(--color-accent)" : "rgba(255,255,255,0.15)",
          }}
        >
          <span
            className="inline-block h-4 w-4 rounded-full bg-white transition-transform duration-200"
            style={{
              transform: showUSD ? "translateX(1.375rem)" : "translateX(0.25rem)",
            }}
          />
        </button>
      </div>

      {/* 价格表格 */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <table className="w-full">
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--color-border)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <th className="text-left px-6 py-4 text-sm font-medium whitespace-nowrap" style={{ color: "var(--color-text-secondary)" }}>
                {t("table.region")}
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium whitespace-nowrap" style={{ color: "var(--color-text-secondary)" }}>
                {t("table.currency")}
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium whitespace-nowrap" style={{ color: "var(--color-text-secondary)" }}>
                {t("table.app_price")}
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                {t("table.iap")}
              </th>
            </tr>
          </thead>
          <tbody>
            {prices.map((p, i) => {
              // 计算 USD 转换后的价格
              const usdAppPrice = usdActive
                ? convertToUSD(p.appPrice, p.currency, exchangeRates)
                : null;
              const displayAppPrice = usdAppPrice ?? p.appPrice;
              const displayCurrency = usdActive ? "USD" : p.currency;

              return (
                <tr
                  key={p.regionCode}
                  className="transition-colors duration-100"
                  style={{
                    borderBottom:
                      i < prices.length - 1 ? "1px solid var(--color-border)" : "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--color-surface-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="mr-2 text-lg">{p.flag}</span>
                    <span className="font-medium">{(() => {
                      const region = getRegionByCode(p.regionCode);
                      return region ? getRegionName(region, locale) : p.regionName;
                    })()}</span>
                    <a
                      href={`https://apps.apple.com/${p.regionCode}/app/id${app.trackId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center ml-1 align-middle"
                      style={{
                        color: "var(--color-text-secondary)",
                        opacity: p.error ? 0.4 : 1,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-accent)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
                      title={t("table.view_in_appstore")}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="text-xs px-2 py-1 rounded-md font-mono"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {displayCurrency}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {p.error ? (
                      <span
                        className="text-sm px-2 py-1 rounded-md"
                        style={{ background: "rgba(255, 69, 58, 0.12)", color: "var(--color-red)" }}
                      >
                        {p.error}
                      </span>
                    ) : (
                      <span
                        className="font-semibold"
                        style={{
                          color: isFreePrice(displayAppPrice)
                            ? "var(--color-green)"
                            : "var(--color-text)",
                        }}
                      >
                        {displayAppPrice}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {p.inAppPurchases.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {p.inAppPurchases.map((iap, idx) => {
                          const usdIapPrice = usdActive
                            ? convertToUSD(iap.price, p.currency, exchangeRates)
                            : null;
                          const displayIapPrice = usdIapPrice ?? iap.price;
                          return (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 rounded-md"
                              style={{
                                background: "rgba(255,255,255,0.06)",
                                color: "var(--color-text-secondary)",
                              }}
                              title={iap.name}
                            >
                              {iap.name}: {displayIapPrice}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        {t("table.no_iap")}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-center text-xs mt-4" style={{ color: "var(--color-text-secondary)" }}>
        {t("table.footer")}
      </p>
    </div>
  );
}

function isFreePrice(price: string): boolean {
  const lower = price.toLowerCase();
  return lower === "free" || price === "免费" || price === "無料" || price === "무료";
}

function formatNumber(n: number, locale: string): string {
  const wanUnit: Record<string, string> = { zh: "万", ja: "万", ko: "만", en: "k" };
  const unit = wanUnit[locale] || "k";
  if (unit === "k") {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  } else {
    if (n >= 10000) return `${(n / 10000).toFixed(1)}${unit}`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  }
  return String(n);
}
