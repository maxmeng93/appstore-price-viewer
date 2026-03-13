"use client";

import type { AppInfo, RegionPrice } from "@/lib/types";

interface PriceTableProps {
  app: AppInfo;
  prices: RegionPrice[];
  isLoading: boolean;
}

export default function PriceTable({ app, prices, isLoading }: PriceTableProps) {
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
                {app.userRatingCount && ` (${formatNumber(app.userRatingCount)})`}
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
              <th className="text-left px-6 py-4 text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                地区
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                货币
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                App 价格
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                内购项目
              </th>
            </tr>
          </thead>
          <tbody>
            {prices.map((p, i) => (
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
                <td className="px-6 py-4">
                  <span className="mr-2 text-lg">{p.flag}</span>
                  <span className="font-medium">{p.regionName}</span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className="text-xs px-2 py-1 rounded-md font-mono"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {p.currency}
                  </span>
                </td>
                <td className="px-6 py-4">
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
                        color:
                          p.appPrice === "Free" || p.appPrice === "免费" || p.appPrice === "無料"
                            ? "var(--color-green)"
                            : "var(--color-text)",
                      }}
                    >
                      {p.appPrice}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {p.inAppPurchases.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {p.inAppPurchases.slice(0, 3).map((iap, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 rounded-md"
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            color: "var(--color-text-secondary)",
                          }}
                          title={iap.name}
                        >
                          {iap.name}: {iap.price}
                        </span>
                      ))}
                      {p.inAppPurchases.length > 3 && (
                        <span
                          className="text-xs px-2 py-1 rounded-md"
                          style={{ color: "var(--color-accent)" }}
                        >
                          +{p.inAppPurchases.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      —
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-center text-xs mt-4" style={{ color: "var(--color-text-secondary)" }}>
        价格数据来源于 Apple iTunes API 和 App Store 公开页面，缓存 24 小时
      </p>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
