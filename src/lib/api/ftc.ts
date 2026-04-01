/**
 * 공정거래위원회 가맹사업거래 통계 API 클라이언트
 * API 문서: https://www.data.go.kr/data/15100585/openapi.do
 * Base URL: https://apis.data.go.kr/1130000/FftcBrandFrcsStatsService
 */

const FTC_API_BASE = "https://apis.data.go.kr/1130000/FftcBrandFrcsStatsService/getBrandFrcsStats";
const FTC_API_KEY = process.env.FTC_API_KEY || "";

export interface FTCBrandSearchResult {
  ftcId: string;          // "corpNm_brandNm" 조합으로 생성
  brandName: string;      // brandNm
  companyName: string;    // corpNm
  businessNumber: string; // 이 API에 없음 → 빈 문자열
  industry: string;       // "indutyLclasNm > indutyMlsfcNm" 형태
  totalStores?: number;   // frcsCnt
  avgRevenue?: number;    // avrgSlsAmt (천원)
  franchiseFee?: number;  // 이 API에 없음
  educationFee?: number;  // 이 API에 없음
  depositFee?: number;    // 이 API에 없음
  royalty?: string;       // 이 API에 없음
  registeredAt?: string;  // 이 API에 없음
  // 추가 데이터
  newStores?: number;     // newFrcsRgsCnt
  contractEnd?: number;   // ctrtEndCnt
  contractCancel?: number; // ctrtCncltnCnt
  revenuePerArea?: number; // arUnitAvrgSlsAmt
  year?: string;          // yr
}

export interface FTCBrandDetail extends FTCBrandSearchResult {
  address?: string;
  representative?: string;
  phone?: string;
  establishedAt?: string;
  franchiseStartedAt?: string;
  rawData?: any;
}

interface FTCAPIResponse {
  resultCode: string;
  resultMsg: string;
  numOfRows: string;
  pageNo: string;
  totalCount: number;
  items: Array<{
    yr: string;
    indutyLclasNm: string;       // 업종 대분류
    indutyMlsfcNm: string;       // 업종 소분류
    corpNm: string;              // 법인명
    brandNm: string;             // 브랜드명
    frcsCnt: number;             // 가맹점 수
    newFrcsRgsCnt: number;       // 신규 등록 수
    ctrtEndCnt: number;          // 계약 종료 수
    ctrtCncltnCnt: number;       // 계약 해지 수
    nmChgCnt: number;            // 명칭 변경 수
    avrgSlsAmt: number;          // 평균 매출액 (천원)
    arUnitAvrgSlsAmt: number;    // 면적당 평균 매출 (천원)
  }>;
}

/**
 * 전체 프랜차이즈 브랜드 목록 조회 (페이지 단위)
 */
export async function listAllFranchiseBrands(
  page: number = 1,
  pageSize: number = 100,
  yr: string = "2024"
): Promise<{ brands: FTCBrandSearchResult[]; total: number; page: number; totalPages: number }> {
  if (!FTC_API_KEY || FTC_API_KEY === "") {
    console.error("FTC_API_KEY not configured");
    return { brands: [], total: 0, page, totalPages: 0 };
  }

  try {
    const params = new URLSearchParams({
      serviceKey: FTC_API_KEY,
      pageNo: String(page),
      numOfRows: String(pageSize),
      yr: yr,
      resultType: "json",
    });

    const response = await fetch(`${FTC_API_BASE}?${params}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`FTC API error: ${response.status}`);
    }

    const data: FTCAPIResponse = await response.json();

    if (data.resultCode !== "00") {
      throw new Error(`FTC API error: ${data.resultMsg}`);
    }

    const brands = (data.items || []).map((item) => ({
      ftcId: `${item.corpNm}_${item.brandNm}`,
      brandName: item.brandNm,
      companyName: item.corpNm,
      businessNumber: "",
      industry: `${item.indutyLclasNm} > ${item.indutyMlsfcNm}`,
      totalStores: item.frcsCnt,
      avgRevenue: item.avrgSlsAmt,
      newStores: item.newFrcsRgsCnt,
      contractEnd: item.ctrtEndCnt,
      contractCancel: item.ctrtCncltnCnt,
      revenuePerArea: item.arUnitAvrgSlsAmt,
      year: item.yr,
    }));

    const total = data.totalCount || brands.length;

    return {
      brands,
      total,
      page,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error("Error listing FTC brands:", error);
    return { brands: [], total: 0, page, totalPages: 0 };
  }
}

/**
 * 브랜드명으로 프랜차이즈 검색
 * @deprecated 실제 API에 검색 파라미터가 없으므로 DB 검색으로 대체 필요
 */
export async function searchFranchiseBrands(
  brandName: string,
  page: number = 1
): Promise<{ brands: FTCBrandSearchResult[]; total: number }> {
  console.warn("searchFranchiseBrands is deprecated. Use DB search directly in API route.");
  return { brands: [], total: 0 };
}

/**
 * FTC ID로 브랜드 상세정보 조회
 * @deprecated 단건 조회 API 없음
 */
export async function getFranchiseBrandDetail(
  ftcId: string
): Promise<FTCBrandDetail | null> {
  console.warn("getFranchiseBrandDetail is deprecated. No detail API available.");
  return null;
}

/**
 * 사업자등록번호로 프랜차이즈 브랜드 검색
 * @deprecated 사업자번호 검색 API 없음, DB 검색으로 대체 필요
 */
export async function searchFranchiseByBusinessNumber(
  businessNumber: string
): Promise<FTCBrandDetail | null> {
  console.warn("searchFranchiseByBusinessNumber is deprecated. Use DB search directly.");
  return null;
}
