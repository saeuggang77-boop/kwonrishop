import { NextRequest, NextResponse } from "next/server";
import { getRentalTrends } from "@/lib/api/molit-rental";

/**
 * GET /api/external/rental-trends
 * Query params: regionCode (required), industryType (optional)
 * 무료 공개 데이터 - 로그인 불필요
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const regionCode = searchParams.get("regionCode");
    const industryType = searchParams.get("industryType");

    if (!regionCode) {
      return NextResponse.json(
        { error: "regionCode parameter is required" },
        { status: 400 }
      );
    }

    const data = await getRentalTrends(regionCode, industryType || undefined);

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800",
      },
    });
  } catch (error) {
    console.error("Error in rental-trends API:", error);
    return NextResponse.json(
      { error: "Failed to fetch rental trend data" },
      { status: 500 }
    );
  }
}
