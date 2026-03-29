/**
 * 소상공인 상가정보 API 클라이언트
 * API 문서: https://apis.data.go.kr/B553077/api/open/sdsc2
 */

const SMALL_BIZ_API_BASE = "https://apis.data.go.kr/B553077/api/open/sdsc2";
const FTC_API_KEY = process.env.FTC_API_KEY || "";

export interface CommercialDistrictData {
  totalStores: number; // 주변 상가 수
  categoryDistribution: {
    name: string;
    count: number;
    percentage: number;
  }[];
  floatingPopulation: "상" | "중" | "하"; // 유동인구 수준
  avgMonthlyRevenue: number; // 평균 월 매출 (만원)
  mainCategories: string[]; // 주요 업종 top 5
  residentialPopulation: number; // 주거인구
  officePopulation: number; // 직장인구
  sameCategoryCount: number; // 동종업종 수
  competitionLevel: "낮음" | "보통" | "높음"; // 경쟁강도
  closureRate: number; // 폐업률 (%)
  nationalAvgClosureRate: number; // 전국 평균 폐업률 (%)
  closureStability: "안정" | "보통" | "위험"; // 폐업 안정성
  populationByTime: number[]; // 시간대별 유동인구 (6시~24시, 2시간 간격 = 10개)
  peakTimes: string[]; // 피크타임 (예: ["12시", "18시"])
  mainAgeGroup: string; // 주요 연령대 (예: "20~30대")
  mainAgeGroupPercentage: number; // 비율 (예: 62)
  quarterChange: number; // 전분기 대비 유동인구 변화율 (%)
}

/**
 * 좌표 기반 상권 정보 조회
 */
export async function getCommercialDistrictInfo(
  lat: number,
  lng: number,
  radius: number = 500
): Promise<CommercialDistrictData> {
  // Dev mode: return mock data if no API key
  if (!FTC_API_KEY || FTC_API_KEY === "") {
    console.warn("FTC_API_KEY not configured, returning mock data");
    return getMockCommercialData(lat, lng);
  }

  try {
    const params = new URLSearchParams({
      key: FTC_API_KEY,
      type: "json",
      indsLclsCd: "Q", // 상가 업종 대분류 코드
      radius: String(radius),
      cx: String(lng),
      cy: String(lat),
    });

    const response = await fetch(`${SMALL_BIZ_API_BASE}/storeZoneOne?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Small Biz API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform API response to our format
    const items = data.body?.items || [];
    const categoryMap = new Map<string, number>();

    items.forEach((item: any) => {
      const category = item.indsLclsNm || "기타";
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    const totalStores = items.length;
    const categoryDistribution = Array.from(categoryMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalStores) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    const mainCategories = categoryDistribution.slice(0, 5).map((c) => c.name);

    // Note: Real API response doesn't have these fields yet, so we provide defaults
    // In production, these should come from the actual API response
    return {
      totalStores,
      categoryDistribution,
      floatingPopulation: totalStores > 500 ? "상" : totalStores > 200 ? "중" : "하",
      avgMonthlyRevenue: data.body?.avgMonthlyRevenue || 0,
      mainCategories,
      residentialPopulation: data.body?.residentialPopulation || 0,
      officePopulation: data.body?.officePopulation || 0,
      sameCategoryCount: data.body?.sameCategoryCount || 0,
      competitionLevel: data.body?.competitionLevel || "보통",
      closureRate: data.body?.closureRate || 0,
      nationalAvgClosureRate: 12.0,
      closureStability: data.body?.closureStability || "보통",
      populationByTime: data.body?.populationByTime || [],
      peakTimes: data.body?.peakTimes || [],
      mainAgeGroup: data.body?.mainAgeGroup || "",
      mainAgeGroupPercentage: data.body?.mainAgeGroupPercentage || 0,
      quarterChange: data.body?.quarterChange || 0,
    };
  } catch (error) {
    console.error("Error fetching commercial district info:", error);
    // Fallback to mock data on error
    return getMockCommercialData(lat, lng);
  }
}

/**
 * 주소 기반 상권 정보 조회 (Optional)
 */
export async function getCommercialDistrictByAddress(
  address: string
): Promise<CommercialDistrictData> {
  // Note: This would require geocoding the address first
  // For now, return mock data
  console.warn("Address-based search not fully implemented, returning mock data");
  return getMockCommercialData(37.5665, 126.978);
}

// Mock data for development/testing
function getMockCommercialData(lat: number, lng: number): CommercialDistrictData {
  // Determine which area based on coordinates (rough approximation)
  let areaType: "gangnam" | "hongdae" | "jongno" = "jongno";

  if (lat > 37.5 && lng > 127.0) {
    areaType = "gangnam";
  } else if (lat > 37.55 && lng < 126.93) {
    areaType = "hongdae";
  }

  const mockDataByArea: Record<string, CommercialDistrictData> = {
    gangnam: {
      totalStores: 847,
      categoryDistribution: [
        { name: "외식업", count: 312, percentage: 37 },
        { name: "카페/디저트", count: 189, percentage: 22 },
        { name: "소매", count: 156, percentage: 18 },
        { name: "서비스", count: 123, percentage: 15 },
        { name: "기타", count: 67, percentage: 8 },
      ],
      floatingPopulation: "상",
      avgMonthlyRevenue: 18500,
      mainCategories: ["외식업", "카페/디저트", "소매", "서비스", "기타"],
      residentialPopulation: 45000,
      officePopulation: 89000,
      sameCategoryCount: 23,
      competitionLevel: "보통",
      closureRate: 8.2,
      nationalAvgClosureRate: 12.0,
      closureStability: "안정",
      populationByTime: [2100, 3200, 5800, 9500, 6800, 5200, 8900, 7300, 4700, 1600],
      peakTimes: ["12시", "18시"],
      mainAgeGroup: "20~30대",
      mainAgeGroupPercentage: 62,
      quarterChange: 12,
    },
    hongdae: {
      totalStores: 623,
      categoryDistribution: [
        { name: "외식업", count: 245, percentage: 39 },
        { name: "카페/디저트", count: 168, percentage: 27 },
        { name: "의류/잡화", count: 98, percentage: 16 },
        { name: "문화/여가", count: 67, percentage: 11 },
        { name: "기타", count: 45, percentage: 7 },
      ],
      floatingPopulation: "상",
      avgMonthlyRevenue: 14200,
      mainCategories: ["외식업", "카페/디저트", "의류/잡화", "문화/여가", "기타"],
      residentialPopulation: 28000,
      officePopulation: 34000,
      sameCategoryCount: 31,
      competitionLevel: "높음",
      closureRate: 10.5,
      nationalAvgClosureRate: 12.0,
      closureStability: "보통",
      populationByTime: [1800, 2900, 5200, 8800, 6200, 4800, 9200, 8100, 5500, 2100],
      peakTimes: ["12시", "18시"],
      mainAgeGroup: "20~30대",
      mainAgeGroupPercentage: 71,
      quarterChange: 8,
    },
    jongno: {
      totalStores: 456,
      categoryDistribution: [
        { name: "외식업", count: 167, percentage: 37 },
        { name: "소매", count: 112, percentage: 25 },
        { name: "서비스", count: 89, percentage: 19 },
        { name: "카페", count: 56, percentage: 12 },
        { name: "기타", count: 32, percentage: 7 },
      ],
      floatingPopulation: "중",
      avgMonthlyRevenue: 9800,
      mainCategories: ["외식업", "소매", "서비스", "카페", "기타"],
      residentialPopulation: 52000,
      officePopulation: 67000,
      sameCategoryCount: 12,
      competitionLevel: "낮음",
      closureRate: 6.5,
      nationalAvgClosureRate: 12.0,
      closureStability: "안정",
      populationByTime: [2500, 3800, 5500, 7200, 5900, 4500, 6800, 5200, 3200, 1200],
      peakTimes: ["12시", "17시"],
      mainAgeGroup: "30~40대",
      mainAgeGroupPercentage: 48,
      quarterChange: -3,
    },
  };

  return mockDataByArea[areaType];
}
