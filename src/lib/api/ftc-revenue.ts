/**
 * 공정거래위원회 지역별 업종별 평균 매출 API 클라이언트
 * API 문서: https://www.data.go.kr/data/15100582/openapi.do
 * Base URL: https://apis.data.go.kr/1130000/FftcAreaIndutyAvrStatsService
 */

const FTC_API_KEY = process.env.FTC_API_KEY || "";

// 3개 오퍼레이션
const FTC_REVENUE_API_OUT = "https://apis.data.go.kr/1130000/FftcAreaIndutyAvrStatsService/getAreaIndutyAvrOutStats"; // 외식업
const FTC_REVENUE_API_SRVC = "https://apis.data.go.kr/1130000/FftcAreaIndutyAvrStatsService/getAreaIndutyAvrSrvcStats"; // 서비스업
const FTC_REVENUE_API_WHRT = "https://apis.data.go.kr/1130000/FftcAreaIndutyAvrStatsService/getAreaIndutyAvrWhrtStats"; // 도소매업

export interface IndustryRevenueData {
  region: string;         // areaNm
  industry: string;       // indutyMlsfcNm
  avgRevenue: number;     // frcsCnt (천원 단위 - API 필드명이 혼란스럽지만 실제 매출액)
  revenuePerArea: number; // arUnitAvrgSlsAmt (천원)
  year: number;           // yr
  category: string;       // "외식" | "서비스" | "도소매"
}

interface FTCRevenueAPIResponse {
  resultCode: string;
  resultMsg: string;
  totalCount: number;
  items: Array<{
    yr: string;
    indutyMlsfcNm: string;      // 업종 소분류
    areaNm: string;             // 지역명
    frcsCnt: number;            // 평균 매출액 (천원) - 필드명이 frcsCnt이지만 실제로는 매출액!
    arUnitAvrgSlsAmt: number;   // 면적당 평균 매출 (천원)
    crrncyUnitCdNm: string;     // 통화 단위
  }>;
}

/**
 * 특정 카테고리의 지역별 업종별 평균 매출 조회
 */
async function fetchRevenueByCategoryAPI(
  category: "외식" | "서비스" | "도소매",
  yr: string = "2024"
): Promise<IndustryRevenueData[]> {
  if (!FTC_API_KEY || FTC_API_KEY === "") {
    console.error("FTC_API_KEY not configured");
    return [];
  }

  const apiUrl =
    category === "외식" ? FTC_REVENUE_API_OUT :
    category === "서비스" ? FTC_REVENUE_API_SRVC :
    FTC_REVENUE_API_WHRT;

  try {
    const params = new URLSearchParams({
      serviceKey: FTC_API_KEY,
      pageNo: "1",
      numOfRows: "1000",
      yr: yr,
      resultType: "json",
    });

    const response = await fetch(`${apiUrl}?${params}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`FTC Revenue API error: ${response.status}`);
    }

    const data: FTCRevenueAPIResponse = await response.json();

    if (data.resultCode !== "00") {
      throw new Error(`FTC Revenue API error: ${data.resultMsg}`);
    }

    return (data.items || []).map((item) => ({
      region: item.areaNm,
      industry: item.indutyMlsfcNm,
      avgRevenue: item.frcsCnt, // 필드명이 frcsCnt이지만 실제로는 매출액
      revenuePerArea: item.arUnitAvrgSlsAmt,
      year: parseInt(item.yr, 10),
      category: category,
    }));
  } catch (error) {
    console.error(`Error fetching ${category} revenue data:`, error);
    return [];
  }
}

/**
 * 지역별 업종별 평균 매출 조회 (필터링 지원)
 */
export async function getIndustryAvgRevenue(
  region?: string,
  industry?: string,
  category?: "외식" | "서비스" | "도소매",
  yr: string = "2024"
): Promise<IndustryRevenueData[]> {
  let allData: IndustryRevenueData[] = [];

  if (category) {
    // 특정 카테고리만 조회
    allData = await fetchRevenueByCategoryAPI(category, yr);
  } else {
    // 모든 카테고리 조회 (병렬 처리)
    const [outData, srvcData, whrtData] = await Promise.all([
      fetchRevenueByCategoryAPI("외식", yr),
      fetchRevenueByCategoryAPI("서비스", yr),
      fetchRevenueByCategoryAPI("도소매", yr),
    ]);
    allData = [...outData, ...srvcData, ...whrtData];
  }

  // 필터링
  let filtered = allData;
  if (region) {
    filtered = filtered.filter((item) => item.region.includes(region));
  }
  if (industry) {
    filtered = filtered.filter((item) => item.industry.includes(industry));
  }

  return filtered;
}

/**
 * 전체 매출 데이터 조회 (캐시/임포트용)
 */
export async function getAllIndustryRevenue(
  yr: string = "2024"
): Promise<IndustryRevenueData[]> {
  const [outData, srvcData, whrtData] = await Promise.all([
    fetchRevenueByCategoryAPI("외식", yr),
    fetchRevenueByCategoryAPI("서비스", yr),
    fetchRevenueByCategoryAPI("도소매", yr),
  ]);

  return [...outData, ...srvcData, ...whrtData];
}
