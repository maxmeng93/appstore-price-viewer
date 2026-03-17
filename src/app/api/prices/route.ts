import { NextRequest, NextResponse } from "next/server";
import { getRegionPrice, lookupApp } from "@/lib/appstore";
import { getCachedPrice, setCachedPrice, incrementAppView } from "@/lib/cache";
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
    // 获取 App 基本信息，失败时使用前端传来的备份信息降级
    let app = await lookupApp(trackId, "us");
    if (!app) {
      const trackName = searchParams.get("trackName") || `App ${trackId}`;
      const artworkUrl512 = searchParams.get("artworkUrl512") || "";
      app = {
        trackId,
        trackName,
        artworkUrl512,
        bundleId: "",
        sellerName: "",
        primaryGenreName: "",
        price: 0,
        currency: "USD",
        formattedPrice: "",
      };
    }

    // 记录查看次数
    incrementAppView(trackId, app.trackName, app.artworkUrl512);

    // 并发查询各地区价格，优先从缓存读取
    const prices = await Promise.all(
      regionCodes.map(async (code): Promise<RegionPrice> => {
        // 尝试缓存（内部已处理 7 天过期）
        const cached = getCachedPrice(trackId, code);
        if (cached) return cached;

        // 缓存未命中，实际查询
        const result = await getRegionPrice(trackId, code);

        // 写入缓存
        setCachedPrice(trackId, code, result);

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
