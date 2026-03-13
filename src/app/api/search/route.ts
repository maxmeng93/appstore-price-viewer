import { NextRequest, NextResponse } from "next/server";
import { searchApps } from "@/lib/appstore";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get("term");
  const country = searchParams.get("country") || "us";

  if (!term) {
    return NextResponse.json(
      { error: "Missing search term" },
      { status: 400 }
    );
  }

  try {
    const result = await searchApps(term, country, 8);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
