import { NextRequest, NextResponse } from "next/server";
import { getRegionPrice, lookupApp } from "@/lib/appstore";
import { getCached, setCache, makeCacheKey } from "@/lib/cache";
import { DEFAULT_REGIONS } from "@/lib/regions";
import type { RegionPrice } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trackIdStr = searchParams.get("trackId");
  const regionsParam = searchParams.get("regions"); // 逗号分隔的地区代码

  if (!trackIdStr) {
    return NextResponse.json(
      { error: "Missing trackId" },
      { status: 400 }
    );
  }

  const trackId = parseInt(trackIdStr, 10);
  if (isNaN(trackId)) {
    return NextResponse.json(
      { error: "Invalid trackId" },
      { status: 400 }
    );
  }

  const regionCodes = (
    regionsParam
      ? regionsParam.split(",").map((s) => s.trim().toLowerCase())
      : DEFAULT_REGIONS
  ).slice(0, 15);

  try {
    // 获取 App 基本信息
    const app = await lookupApp(trackId, "us");
    if (!app) {
      return NextResponse.json(
        { error: "App not found" },
        { status: 404 }
      );
    }

    // 并发查询各地区价格，优先从缓存读取
    const prices = await Promise.all(
      regionCodes.map(async (code): Promise<RegionPrice> => {
        const cacheKey = makeCacheKey(trackId, code);

        // 尝试缓存
        const cached = await getCached<RegionPrice>(cacheKey);
        if (cached) return cached;

        // 缓存未命中，实际查询
        const result = await getRegionPrice(trackId, code);

        // 写入缓存（不阻塞响应）
        setCache(cacheKey, result).catch(() => {});

        return result;
      })
    );

    return NextResponse.json({ app, prices });
  } catch (error) {
    console.error("Price query error:", error);
    return NextResponse.json(
      { error: "Price query failed" },
      { status: 500 }
    );
  }
}
