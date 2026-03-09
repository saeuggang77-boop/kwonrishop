import { NextRequest, NextResponse } from "next/server";
import { getIndustryAvgRevenue } from "@/lib/api/ftc-revenue";

/**
 * GET /api/external/industry-revenue
 * Query params: region (required), industry (required)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const region = searchParams.get("region");
    const industry = searchParams.get("industry");

    if (!region || !industry) {
      return NextResponse.json(
        { error: "region and industry parameters are required" },
        { status: 400 }
      );
    }

    const data = await getIndustryAvgRevenue(region, industry);

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Error in industry-revenue API:", error);
    return NextResponse.json(
      { error: "Failed to fetch industry revenue data" },
      { status: 500 }
    );
  }
}
