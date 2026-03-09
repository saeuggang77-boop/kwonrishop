/**
 * 공정거래위원회 지역별 업종별 평균 매출 API 클라이언트
 * API 문서: https://apis.data.go.kr/1130000/FftcBrandFrcsAreaMrtsInfo
 */

const FTC_REVENUE_API_BASE =
  "https://apis.data.go.kr/1130000/FftcBrandFrcsAreaMrtsInfo";
const FTC_API_KEY = process.env.FTC_API_KEY || "";

export interface IndustryRevenueData {
  region: string;
  industry: string;
  avgRevenue: number; // 만원 단위
  storeCount: number;
  year: number;
  quarterName: string;
}

export interface IndustryRevenueResponse {
  items: IndustryRevenueData[];
  totalCount: number;
}

/**
 * 지역별 업종별 평균 매출 조회
 */
export async function getIndustryAvgRevenue(
  region: string,
  industry: string
): Promise<IndustryRevenueResponse> {
  // Dev mode: return mock data if no API key
  if (!FTC_API_KEY || FTC_API_KEY === "") {
    console.warn("FTC_API_KEY not configured, returning mock data");
    return getMockRevenueData(region, industry);
  }

  try {
    const params = new URLSearchParams({
      region: region,
      industry: industry,
      serviceKey: FTC_API_KEY,
      numOfRows: "100",
      pageNo: "1",
    });

    const response = await fetch(`${FTC_REVENUE_API_BASE}?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`FTC Revenue API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform API response to our format
    const items = (data.response?.body?.items?.item || []).map((item: any) => ({
      region: item.areaNm || region,
      industry: item.indutyNm || industry,
      avgRevenue: item.avrgSelngAm || 0,
      storeCount: item.storeCo || 0,
      year: item.year || new Date().getFullYear(),
      quarterName: item.qtrNm || "1분기",
    }));

    return {
      items,
      totalCount: data.response?.body?.totalCount || items.length,
    };
  } catch (error) {
    console.error("Error fetching industry revenue data:", error);
    // Fallback to mock data on error
    return getMockRevenueData(region, industry);
  }
}

// Mock data for development/testing
function getMockRevenueData(
  region: string,
  industry: string
): IndustryRevenueResponse {
  const mockData: IndustryRevenueData[] = [
    {
      region: "서울",
      industry: "외식업",
      avgRevenue: 12500,
      storeCount: 3450,
      year: 2024,
      quarterName: "4분기",
    },
    {
      region: "서울",
      industry: "카페",
      avgRevenue: 8200,
      storeCount: 2890,
      year: 2024,
      quarterName: "4분기",
    },
    {
      region: "경기",
      industry: "외식업",
      avgRevenue: 9800,
      storeCount: 4120,
      year: 2024,
      quarterName: "4분기",
    },
    {
      region: "경기",
      industry: "소매",
      avgRevenue: 7500,
      storeCount: 2340,
      year: 2024,
      quarterName: "4분기",
    },
    {
      region: "부산",
      industry: "외식업",
      avgRevenue: 8900,
      storeCount: 1560,
      year: 2024,
      quarterName: "4분기",
    },
    {
      region: "부산",
      industry: "카페",
      avgRevenue: 6500,
      storeCount: 980,
      year: 2024,
      quarterName: "4분기",
    },
  ];

  const filtered = mockData.filter(
    (item) =>
      item.region.includes(region) || item.industry.includes(industry)
  );

  return {
    items: filtered.length > 0 ? filtered : mockData,
    totalCount: filtered.length > 0 ? filtered.length : mockData.length,
  };
}
