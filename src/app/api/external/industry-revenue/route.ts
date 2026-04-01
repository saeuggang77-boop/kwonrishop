import { NextRequest, NextResponse } from "next/server";
import { getIndustryAvgRevenue } from "@/lib/api/ftc-revenue";

/**
 * GET /api/external/industry-revenue
 * Query params: region (optional), industry (required)
 * 응답: { industryAvgRevenue, regionalData: [{ region, avgRevenue, storeCount }] }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const region = searchParams.get("region");
    const industry = searchParams.get("industry");

    if (!industry) {
      return NextResponse.json(
        { error: "industry parameter is required" },
        { status: 400 }
      );
    }

    // 업종명에서 카테고리 추정
    const industryLower = industry.toLowerCase();
    const category = industryLower.includes("서비스") || industryLower.includes("교육") || industryLower.includes("미용")
      ? "서비스" as const
      : industryLower.includes("소매") || industryLower.includes("편의점") || industryLower.includes("도소매")
      ? "도소매" as const
      : "외식" as const;

    // 업종 소분류명 추출 ("외식 > 한식" → "한식")
    const subIndustry = industry.includes(">") ? industry.split(">").pop()?.trim() : industry;

    const items = await getIndustryAvgRevenue(undefined, subIndustry || industry, category);

    // 컴포넌트가 기대하는 형태로 변환
    // API의 avgRevenue는 천원 단위 → 만원 단위로 변환 (÷10)
    const regionalData = items.map((item) => ({
      region: item.region,
      avgRevenue: Math.round(item.avgRevenue / 10), // 천원 → 만원
      storeCount: item.revenuePerArea, // 면적당 매출로 대체 표시
    }));

    // 전체 평균 계산
    const totalRevenue = regionalData.reduce((sum, r) => sum + r.avgRevenue, 0);
    const industryAvgRevenue = regionalData.length > 0
      ? Math.round(totalRevenue / regionalData.length)
      : 0;

    // 특정 지역 필터
    const filteredRegional = region && region !== "전국"
      ? regionalData.filter((r) => r.region.includes(region))
      : regionalData;

    return NextResponse.json({
      industryAvgRevenue,
      regionalData: filteredRegional,
    }, {
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
