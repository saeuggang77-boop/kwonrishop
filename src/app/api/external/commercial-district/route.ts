import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCommercialDistrictInfo } from "@/lib/api/small-biz";

/**
 * GET /api/external/commercial-district
 * Query params: lat (required), lng (required), categoryId (optional)
 *
 * - 로그인한 사용자: 전체 데이터 반환 (200)
 * - 비로그인: 401 Unauthorized
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

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

    // 로그인 여부 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    // 원본 데이터 조회
    const rawData = await getCommercialDistrictInfo(latitude, longitude);

    // API 응답을 컴포넌트 인터페이스에 맞게 변환
    const floatingMap: Record<string, "high" | "medium" | "low"> = {
      "상": "high",
      "중": "medium",
      "하": "low",
    };

    const fullData = {
      totalStores: rawData.totalStores,
      footTraffic: floatingMap[rawData.floatingPopulation] || "medium",
      avgMonthlyRevenue: rawData.avgMonthlyRevenue,
      industryDistribution: rawData.categoryDistribution.map((c) => ({
        name: c.name,
        percentage: c.percentage,
        count: c.count,
      })),
      residentPopulation: rawData.residentialPopulation,
      workingPopulation: rawData.officePopulation,
      sameCategoryCount: rawData.sameCategoryCount,
      competitionLevel: rawData.competitionLevel,
      closureRate: rawData.closureRate,
      nationalAvgClosureRate: rawData.nationalAvgClosureRate,
      closureStability: rawData.closureStability,
      populationByTime: rawData.populationByTime,
      peakTimes: rawData.peakTimes,
      mainAgeGroup: rawData.mainAgeGroup,
      mainAgeGroupPercentage: rawData.mainAgeGroupPercentage,
      quarterChange: rawData.quarterChange,
    };

    return NextResponse.json(fullData, {
      headers: {
        "Cache-Control": "private, s-maxage=300, stale-while-revalidate=600",
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
