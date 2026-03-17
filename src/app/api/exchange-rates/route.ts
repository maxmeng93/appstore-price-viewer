import { NextResponse } from "next/server";
import { getCachedExchangeRates, setCachedExchangeRates } from "@/lib/cache";

export async function GET() {
  try {
    // 尝试从内存缓存读取（1 小时过期）
    const cached = getCachedExchangeRates();
    if (cached) {
      return NextResponse.json(cached);
    }

    // 缓存未命中，请求外部 API
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch exchange rates" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const rates = data.rates as Record<string, number>;

    // 写入内存缓存
    setCachedExchangeRates(rates);

    return NextResponse.json({
      rates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Exchange rates error:", error);
    return NextResponse.json(
      { error: "Failed to fetch exchange rates" },
      { status: 500 }
    );
  }
}
