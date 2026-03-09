import { NextRequest, NextResponse } from "next/server";
import { getCommercialDistrictInfo } from "@/lib/api/small-biz";

/**
 * GET /api/external/commercial-district
 * Query params: lat (required), lng (required), categoryId (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const categoryId = searchParams.get("categoryId");

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "lat and lng parameters are required" },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: "Invalid lat or lng values" },
        { status: 400 }
      );
    }

    const data = await getCommercialDistrictInfo(latitude, longitude);

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Error in commercial-district API:", error);
    return NextResponse.json(
      { error: "Failed to fetch commercial district data" },
      { status: 500 }
    );
  }
}
