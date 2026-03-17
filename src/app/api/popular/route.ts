import { NextRequest, NextResponse } from "next/server";
import { getTopViewedApps } from "@/lib/cache";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limitStr = searchParams.get("limit");
  const limit = Math.min(Math.max(parseInt(limitStr || "20", 10) || 20, 1), 50);

  const apps = getTopViewedApps(limit);
  return NextResponse.json({ apps });
}
