import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCommercialDistrictInfo } from "@/lib/api/small-biz";

/**
 * GET /api/external/commercial-district
 * Query params: lat (required), lng (required), categoryId (optional), listingId (optional)
 *
 * - 구매한 사용자: 전체 데이터 반환 (200)
 * - 미구매/비로그인: 미리보기 데이터 반환 (402)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const listingId = searchParams.get("listingId");

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

    // 구매 여부 확인
    const session = await getServerSession(authOptions);

    if (session?.user?.id && listingId) {
      const purchase = await prisma.adPurchase.findFirst({
        where: {
          userId: session.user.id,
          listingId,
          status: "PAID",
          product: { id: "common-report" },
        },
      });

      if (purchase) {
        return NextResponse.json(fullData, {
          headers: {
            "Cache-Control": "private, s-maxage=300, stale-while-revalidate=600",
          },
        });
      }
    }

    // 미구매 → 미리보기 데이터 (일부 마스킹)
    const previewData = {
      totalStores: fullData.totalStores,
      footTraffic: fullData.footTraffic,
      avgMonthlyRevenue: 0,
      industryDistribution: fullData.industryDistribution.slice(0, 2),
      residentPopulation: 0,
      workingPopulation: 0,
      sameCategoryCount: fullData.sameCategoryCount,
      competitionLevel: fullData.competitionLevel,
      closureRate: fullData.closureRate,
      nationalAvgClosureRate: fullData.nationalAvgClosureRate,
      closureStability: fullData.closureStability,
      populationByTime: [],
      peakTimes: [],
      mainAgeGroup: "",
      mainAgeGroupPercentage: 0,
      quarterChange: 0,
    };

    return NextResponse.json({ preview: previewData }, { status: 402 });
  } catch (error) {
    console.error("Error in commercial-district API:", error);
    return NextResponse.json(
      { error: "Failed to fetch commercial district data" },
      { status: 500 }
    );
  }
}
