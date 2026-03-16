import { NextResponse } from "next/server";
import { getCached, setCache, EXCHANGE_RATE_CACHE_TTL } from "@/lib/cache";

const KV_KEY = "exchange-rates:usd";

interface ExchangeRateResponse {
  rates: Record<string, number>;
  updatedAt: string;
}

export async function GET() {
  try {
    // 尝试从 KV 缓存读取
    const cached = await getCached<ExchangeRateResponse>(KV_KEY);
    if (cached) {
      return NextResponse.json(cached);
    }

    // 缓存未命中，请求外部 API
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch exchange rates" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const result: ExchangeRateResponse = {
      rates: data.rates as Record<string, number>,
      updatedAt: new Date().toISOString(),
    };

    // 写入 KV 缓存（不阻塞响应）
    setCache(KV_KEY, result, EXCHANGE_RATE_CACHE_TTL).catch(() => {});

    return NextResponse.json(result);
  } catch (error) {
    console.error("Exchange rates error:", error);
    return NextResponse.json(
      { error: "Failed to fetch exchange rates" },
      { status: 500 }
    );
  }
}
