/**
 * 한국부동산원 R-ONE API 클라이언트
 * API: https://www.reb.or.kr/r-one/openapi/SttsApiTblData.do
 *
 * 소규모 상가 임대료 및 공실률 데이터 (분기별 업데이트)
 */

const RONE_API_BASE = "https://www.reb.or.kr/r-one/openapi/SttsApiTblData.do";
const RONE_API_KEY = process.env.MOLIT_API_KEY || "";

// 통계표 ID
const STAT_TABLE_IDS = {
  RENTAL: "A_2024_00279",  // 소규모 상가 임대료 (천원/㎡)
  VACANCY: "A_2024_00255", // 소규모 상가 공실률 (%)
} as const;

export interface RentalTrendData {
  avgDeposit: number;       // 지역 평균 보증금 (만원)
  avgMonthlyRent: number;   // 지역 평균 월세 (만원)
  avgPremium: number;       // 지역 평균 권리금 (만원)
  vacancyRate: number;      // 공실률 (%)
  nationalAvgVacancyRate: number;  // 전국 평균 공실률
  rentChangeRate: number;   // 임대가격 변동률 (%, 전분기 대비)
  avgInvestmentYield: number; // 평균 투자수익률 (%)
  region: string;           // 지역명 (예: "강남구")
  quarter: string;          // 분기 (예: "2024년 2분기")
  industryType: string;     // 업종 (예: "카페/음료업")
}

interface RONEApiRow {
  CLS_FULLNM: string;      // 서울>강남>테헤란로
  CLS_NM: string;          // 테헤란로
  ITM_NM: string;          // 임대료 or 공실률
  DTA_VAL: number;         // 값
  UI_NM: string;           // 단위
  WRTTIME_IDTFR_ID: string; // 202402 (분기 코드)
  WRTTIME_DESC: string;    // 2024년 2분기
}

interface RONEApiResponse {
  SttsApiTblData: [
    {
      head: [
        { list_total_count: number },
        { RESULT: { CODE: string; MESSAGE?: string } }
      ]
    },
    {
      row: RONEApiRow[]
    }
  ]
}

interface CachedRegionData {
  rental: number;          // 천원/㎡
  vacancy: number;         // %
  quarter: string;         // 2024년 2분기
  quarterCode: string;     // 202402
  prevRental?: number;     // 이전 분기 임대료 (변동률 계산용)
}

interface CacheData {
  regions: Map<string, CachedRegionData>;
  nationalAvgVacancy: number;
  timestamp: number;
}

// 모듈 레벨 캐시 (12시간 TTL)
let cache: CacheData | null = null;
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

/**
 * 법정동코드 앞 5자리를 R-ONE 지역명으로 매핑
 */
function mapRegionCodeToRONERegion(regionCode: string): string {
  const guCode = regionCode.substring(0, 5);

  // 서울 구 매핑
  const guMapping: Record<string, string> = {
    // 강남권
    "11680": "서울>강남",    // 강남구
    "11650": "서울>강남",    // 서초구

    // 도심권
    "11110": "서울>도심",    // 종로구
    "11140": "서울>도심",    // 중구

    // 영등포신촌권
    "11440": "서울>영등포신촌", // 마포구
    "11560": "서울>영등포신촌", // 영등포구

    // 기타 서울 구 → 서울>기타
    "11170": "서울>기타",    // 용산구
    "11200": "서울>기타",    // 성동구
    "11215": "서울>기타",    // 광진구
    "11230": "서울>기타",    // 동대문구
    "11260": "서울>기타",    // 중랑구
    "11290": "서울>기타",    // 성북구
    "11305": "서울>기타",    // 강북구
    "11320": "서울>기타",    // 도봉구
    "11350": "서울>기타",    // 노원구
    "11380": "서울>기타",    // 은평구
    "11410": "서울>기타",    // 서대문구
    "11470": "서울>기타",    // 양천구
    "11500": "서울>기타",    // 강서구
    "11530": "서울>기타",    // 구로구
    "11545": "서울>기타",    // 금천구
    "11590": "서울>기타",    // 동작구
    "11620": "서울>기타",    // 관악구
    "11710": "서울>기타",    // 송파구
    "11740": "서울>기타",    // 강동구
  };

  return guMapping[guCode] || "전국";
}

/**
 * R-ONE 지역명에서 짧은 지역명 추출
 */
function extractShortRegionName(roneRegion: string): string {
  if (roneRegion === "전국") return "전국";
  if (roneRegion === "서울") return "서울";

  const parts = roneRegion.split(">");
  if (parts.length >= 2) {
    return parts[1]; // "서울>강남" → "강남"
  }
  return roneRegion;
}

/**
 * 지역별 권리금 추정 (R-ONE API에 권리금 데이터 없으므로 입지 기반 추정)
 */
function estimatePremiumByRegion(roneRegion: string): number {
  if (roneRegion.includes("강남")) return 7000;
  if (roneRegion.includes("도심")) return 5000;
  if (roneRegion.includes("영등포신촌")) return 4500;
  if (roneRegion.includes("기타")) return 3000;
  return 2000; // 전국 평균
}

/**
 * 투자수익률 추정 (임대료/공실률 기반)
 */
function estimateInvestmentYield(vacancy: number): number {
  // 공실률이 낮을수록 수익률 높음
  if (vacancy < 8) return 5.5;
  if (vacancy < 12) return 5.0;
  return 4.5;
}

/**
 * R-ONE API 호출 (페이지별)
 */
async function fetchRONEPage(
  statTableId: string,
  page: number,
  pageSize: number = 200
): Promise<RONEApiResponse | null> {
  const params = new URLSearchParams({
    KEY: RONE_API_KEY,
    Type: "json",
    STATBL_ID: statTableId,
    DTACYCLE_CD: "QY", // Quarterly
    pIndex: page.toString(),
    pSize: pageSize.toString(),
  });

  try {
    const response = await fetch(`${RONE_API_BASE}?${params}`, {
      next: { revalidate: CACHE_TTL / 1000 },
    });

    if (!response.ok) {
      console.error(`R-ONE API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // 응답 구조 검증
    if (!data.SttsApiTblData || !Array.isArray(data.SttsApiTblData)) {
      console.error("Invalid R-ONE API response structure");
      return null;
    }

    return data as RONEApiResponse;
  } catch (error) {
    console.error("R-ONE API fetch error:", error);
    return null;
  }
}

/**
 * 캐시 초기화 (R-ONE API에서 데이터 로드)
 */
async function initializeCache(): Promise<void> {
  const rentalData = new Map<string, { rental: number; quarter: string; quarterCode: string }>();
  const vacancyData = new Map<string, number>();
  let nationalVacancy = 11.2; // fallback

  // 1. 첫 페이지로 전체 개수 파악
  const firstPage = await fetchRONEPage(STAT_TABLE_IDS.RENTAL, 1, 200);
  if (!firstPage) {
    throw new Error("Failed to fetch first page from R-ONE API");
  }

  const totalCount = firstPage.SttsApiTblData[0].head[0].list_total_count;
  const totalPages = Math.ceil(totalCount / 200);

  // Total rows/pages info for debugging if needed

  // 2. 마지막 3페이지만 가져오기 (최신 분기 데이터는 끝에 있음)
  const pagesToFetch = Math.max(1, totalPages - 2); // 마지막 3페이지
  const rentalPages: RONEApiResponse[] = [];

  for (let page = pagesToFetch; page <= totalPages; page++) {
    const pageData = page === 1 ? firstPage : await fetchRONEPage(STAT_TABLE_IDS.RENTAL, page, 200);
    if (pageData && pageData.SttsApiTblData[1]?.row) {
      rentalPages.push(pageData);
    }
  }

  // 3. 임대료 데이터 파싱 (최신 분기 + 이전 분기)
  const allRentalRows: RONEApiRow[] = [];
  for (const page of rentalPages) {
    if (page.SttsApiTblData[1]?.row) {
      allRentalRows.push(...page.SttsApiTblData[1].row);
    }
  }

  // 분기별로 그룹화
  const rentalByQuarter = new Map<string, Map<string, RONEApiRow>>();
  for (const row of allRentalRows) {
    if (row.ITM_NM === "임대료") {
      if (!rentalByQuarter.has(row.WRTTIME_IDTFR_ID)) {
        rentalByQuarter.set(row.WRTTIME_IDTFR_ID, new Map());
      }
      rentalByQuarter.get(row.WRTTIME_IDTFR_ID)!.set(row.CLS_FULLNM, row);
    }
  }

  // 최신 분기 찾기
  const quarters = Array.from(rentalByQuarter.keys()).sort().reverse();
  const latestQuarter = quarters[0];
  const prevQuarter = quarters[1];

  // latestQuarter / prevQuarter determined

  // 최신 분기 데이터 저장
  const latestData = rentalByQuarter.get(latestQuarter);
  if (latestData) {
    for (const [region, row] of latestData.entries()) {
      rentalData.set(region, {
        rental: row.DTA_VAL,
        quarter: row.WRTTIME_DESC,
        quarterCode: row.WRTTIME_IDTFR_ID,
      });
    }
  }

  // 4. 공실률 데이터 (같은 방식으로 마지막 3페이지)
  const vacancyPages: RONEApiResponse[] = [];
  for (let page = pagesToFetch; page <= totalPages; page++) {
    const pageData = await fetchRONEPage(STAT_TABLE_IDS.VACANCY, page, 200);
    if (pageData && pageData.SttsApiTblData[1]?.row) {
      vacancyPages.push(pageData);
    }
  }

  const allVacancyRows: RONEApiRow[] = [];
  for (const page of vacancyPages) {
    if (page.SttsApiTblData[1]?.row) {
      allVacancyRows.push(...page.SttsApiTblData[1].row);
    }
  }

  // 최신 분기 공실률만 추출
  for (const row of allVacancyRows) {
    if (row.WRTTIME_IDTFR_ID === latestQuarter && row.ITM_NM === "공실률") {
      vacancyData.set(row.CLS_FULLNM, row.DTA_VAL);

      if (row.CLS_FULLNM === "전국") {
        nationalVacancy = row.DTA_VAL;
      }
    }
  }

  // 5. 이전 분기 임대료 (변동률 계산용)
  const prevData = rentalByQuarter.get(prevQuarter);
  const prevRentalData = new Map<string, number>();
  if (prevData) {
    for (const [region, row] of prevData.entries()) {
      prevRentalData.set(region, row.DTA_VAL);
    }
  }

  // 6. 캐시 구축
  const regions = new Map<string, CachedRegionData>();
  for (const [region, rentalInfo] of rentalData.entries()) {
    const vacancy = vacancyData.get(region) || 11.2;
    const prevRental = prevRentalData.get(region);

    regions.set(region, {
      rental: rentalInfo.rental,
      vacancy,
      quarter: rentalInfo.quarter,
      quarterCode: rentalInfo.quarterCode,
      prevRental,
    });
  }

  cache = {
    regions,
    nationalAvgVacancy: nationalVacancy,
    timestamp: Date.now(),
  };

  // Cache initialized: regions.size regions loaded
}

/**
 * 캐시 가져오기 (TTL 체크)
 */
async function getCache(): Promise<CacheData> {
  const now = Date.now();

  if (!cache || (now - cache.timestamp) > CACHE_TTL) {
    await initializeCache();
  }

  return cache!;
}

/**
 * 임대 트렌드 데이터 조회 (메인 함수)
 */
export async function getRentalTrends(
  regionCode: string,
  industryType?: string
): Promise<RentalTrendData> {
  if (!RONE_API_KEY || RONE_API_KEY === "") {
    console.warn("MOLIT_API_KEY not configured, returning mock data");
    return getMockRentalData(regionCode, industryType);
  }

  try {
    const cacheData = await getCache();
    const roneRegion = mapRegionCodeToRONERegion(regionCode);
    const regionData = cacheData.regions.get(roneRegion);

    if (!regionData) {
      console.warn(`No data for region: ${roneRegion}, falling back to mock`);
      return getMockRentalData(regionCode, industryType);
    }

    // R-ONE 임대료(천원/㎡) → 월세(만원) 변환
    // 가정: 평균 점포 면적 33㎡ (10평)
    // 59.79 천원/㎡ × 33㎡ = 1,973 천원 = 197만원 (천원→만원: ÷10)
    const avgMonthlyRent = Math.round((regionData.rental * 33) / 10); // 만원

    // 보증금 = 월세 × 12 (일반적인 비율)
    const avgDeposit = avgMonthlyRent * 12;

    // 권리금 = 지역별 추정
    const avgPremium = estimatePremiumByRegion(roneRegion);

    // 임대가격 변동률 계산
    let rentChangeRate = 0;
    if (regionData.prevRental && regionData.prevRental > 0) {
      rentChangeRate = ((regionData.rental - regionData.prevRental) / regionData.prevRental) * 100;
    }

    // 투자수익률 추정
    const avgInvestmentYield = estimateInvestmentYield(regionData.vacancy);

    return {
      avgDeposit,
      avgMonthlyRent,
      avgPremium,
      vacancyRate: regionData.vacancy,
      nationalAvgVacancyRate: cacheData.nationalAvgVacancy,
      rentChangeRate,
      avgInvestmentYield,
      region: extractShortRegionName(roneRegion),
      quarter: regionData.quarter,
      industryType: industryType || "소규모 상가",
    };
  } catch (error) {
    console.error("Error fetching rental trends from R-ONE API:", error);
    return getMockRentalData(regionCode, industryType);
  }
}

// ===== Mock Data (Fallback) =====

// 지역코드 앞 5자리로 지역명 매핑
const regionNameMap: Record<string, string> = {
  "11680": "강남구", "11650": "서초구", "11440": "마포구",
  "11560": "영등포구", "11380": "은평구", "11110": "종로구",
  "11140": "중구", "11170": "용산구", "11200": "성동구",
  "11215": "광진구", "11230": "동대문구", "11260": "중랑구",
  "11290": "성북구", "11305": "강북구", "11320": "도봉구",
  "11350": "노원구", "11410": "서대문구", "11470": "양천구",
  "11500": "강서구", "11530": "구로구", "11545": "금천구",
  "11590": "동작구", "11620": "관악구", "11710": "송파구",
  "11740": "강동구",
};

function getMockRentalData(regionCode: string, industryType?: string): RentalTrendData {
  const prefix = regionCode.substring(0, 5);
  const regionName = regionNameMap[prefix] || "서울시";

  // 강남권 vs 비강남권 차별화
  const isGangnam = ["11680", "11650", "11710"].includes(prefix);
  const isMainArea = ["11440", "11560", "11110", "11140"].includes(prefix);

  if (isGangnam) {
    return {
      avgDeposit: 4200, avgMonthlyRent: 280, avgPremium: 7500,
      vacancyRate: 6.8, nationalAvgVacancyRate: 11.2,
      rentChangeRate: 2.1, avgInvestmentYield: 4.8,
      region: regionName, quarter: "2026년 1분기",
      industryType: industryType || "상업용",
    };
  } else if (isMainArea) {
    return {
      avgDeposit: 2800, avgMonthlyRent: 180, avgPremium: 4500,
      vacancyRate: 9.2, nationalAvgVacancyRate: 11.2,
      rentChangeRate: 0.8, avgInvestmentYield: 5.2,
      region: regionName, quarter: "2026년 1분기",
      industryType: industryType || "상업용",
    };
  }

  return {
    avgDeposit: 1800, avgMonthlyRent: 120, avgPremium: 3000,
    vacancyRate: 12.5, nationalAvgVacancyRate: 11.2,
    rentChangeRate: -0.5, avgInvestmentYield: 5.8,
    region: regionName, quarter: "2026년 1분기",
    industryType: industryType || "상업용",
  };
}
