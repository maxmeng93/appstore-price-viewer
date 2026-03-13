"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import PriceTable from "@/components/PriceTable";
import type { AppInfo, RegionPrice } from "@/lib/types";

export default function Home() {
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);
  const [prices, setPrices] = useState<RegionPrice[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectApp = async (app: AppInfo) => {
    setSelectedApp(app);
    setPrices([]);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/prices?trackId=${app.trackId}`);
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

  return (
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
          查询 App Store 应用在全球各地区的价格和内购信息
        </p>
      </div>

      {/* 搜索栏 */}
      <SearchBar onSelect={handleSelectApp} />

      {/* 价格表格 */}
      {(isLoading || selectedApp) && (
        <PriceTable
          app={selectedApp!}
          prices={prices}
          isLoading={isLoading}
        />
      )}

      {/* Empty state */}
      {!selectedApp && !isLoading && (
        <div className="text-center mt-20">
          <div className="text-6xl mb-6 opacity-30">🔍</div>
          <p style={{ color: "var(--color-text-secondary)" }}>
            搜索任意 App，查看全球各地区的价格对比
          </p>
          <div
            className="flex flex-wrap justify-center gap-2 mt-6 max-w-lg mx-auto"
          >
            {["微信", "Notion", "Procreate", "1Password", "Bear"].map(
              (name) => (
                <button
                  key={name}
                  onClick={() => {
                    // 触发搜索
                    const input = document.querySelector("input");
                    if (input) {
                      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                        window.HTMLInputElement.prototype,
                        "value"
                      )?.set;
                      nativeInputValueSetter?.call(input, name);
                      input.dispatchEvent(new Event("input", { bubbles: true }));
                      // 或者手动触发 onChange
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
                  {name}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </main>
  );
}
