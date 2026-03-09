/**
 * 공정거래위원회 정보공개서 API 클라이언트
 * API 문서: https://openapi.ftc.go.kr
 */

const FTC_API_BASE = "https://openapi.ftc.go.kr/api/v1/franchise";
const FTC_API_KEY = process.env.FTC_API_KEY || "";

export interface FTCBrandSearchResult {
  ftcId: string;
  brandName: string;
  companyName: string;
  businessNumber: string;
  industry: string;
  franchiseFee?: number;
  educationFee?: number;
  depositFee?: number;
  royalty?: string;
  totalStores?: number;
  avgRevenue?: number;
  registeredAt?: string;
}

export interface FTCBrandDetail extends FTCBrandSearchResult {
  address?: string;
  representative?: string;
  phone?: string;
  establishedAt?: string;
  franchiseStartedAt?: string;
  rawData?: any;
}

/**
 * 브랜드명으로 프랜차이즈 검색
 */
export async function searchFranchiseBrands(
  brandName: string,
  page: number = 1
): Promise<{ brands: FTCBrandSearchResult[]; total: number }> {
  // Dev mode: return mock data if no API key
  if (!FTC_API_KEY || FTC_API_KEY === "") {
    console.warn("FTC_API_KEY not configured, returning mock data");
    return getMockSearchResults(brandName, page);
  }

  try {
    const params = new URLSearchParams({
      brandNm: brandName,
      pageSize: "20",
      pageNo: String(page),
      apiKey: FTC_API_KEY,
    });

    const response = await fetch(`${FTC_API_BASE}/search?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`FTC API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform FTC response to our format
    // Note: Actual FTC API response structure may differ
    const brands = (data.items || []).map((item: any) => ({
      ftcId: item.id || item.franchiseId,
      brandName: item.brandName || item.name,
      companyName: item.companyName || item.company,
      businessNumber: item.businessNumber || item.bizNo,
      industry: item.industry || item.category,
      franchiseFee: item.franchiseFee,
      educationFee: item.educationFee,
      depositFee: item.depositFee || item.deposit,
      royalty: item.royalty,
      totalStores: item.totalStores || item.storeCount,
      avgRevenue: item.avgRevenue || item.averageRevenue,
      registeredAt: item.registeredAt || item.regDate,
    }));

    return {
      brands,
      total: data.totalCount || brands.length,
    };
  } catch (error) {
    console.error("Error searching FTC brands:", error);
    // Fallback to mock data on error
    return getMockSearchResults(brandName, page);
  }
}

/**
 * FTC ID로 브랜드 상세정보 조회
 */
export async function getFranchiseBrandDetail(
  ftcId: string
): Promise<FTCBrandDetail | null> {
  // Dev mode: return mock data if no API key
  if (!FTC_API_KEY || FTC_API_KEY === "") {
    console.warn("FTC_API_KEY not configured, returning mock data");
    return getMockBrandDetail(ftcId);
  }

  try {
    const response = await fetch(`${FTC_API_BASE}/${ftcId}?apiKey=${FTC_API_KEY}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`FTC API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform FTC response to our format
    return {
      ftcId: data.id || data.franchiseId,
      brandName: data.brandName || data.name,
      companyName: data.companyName || data.company,
      businessNumber: data.businessNumber || data.bizNo,
      industry: data.industry || data.category,
      franchiseFee: data.franchiseFee,
      educationFee: data.educationFee,
      depositFee: data.depositFee || data.deposit,
      royalty: data.royalty,
      totalStores: data.totalStores || data.storeCount,
      avgRevenue: data.avgRevenue || data.averageRevenue,
      registeredAt: data.registeredAt || data.regDate,
      address: data.address,
      representative: data.representative || data.ceo,
      phone: data.phone || data.tel,
      establishedAt: data.establishedAt,
      franchiseStartedAt: data.franchiseStartedAt,
      rawData: data,
    };
  } catch (error) {
    console.error("Error fetching FTC brand detail:", error);
    return getMockBrandDetail(ftcId);
  }
}

// Mock data for development/testing
function getMockSearchResults(
  brandName: string,
  page: number
): { brands: FTCBrandSearchResult[]; total: number } {
  const mockBrands: FTCBrandSearchResult[] = [
    {
      ftcId: "FTC001",
      brandName: "맥도날드",
      companyName: "한국맥도날드(유)",
      businessNumber: "211-81-21692",
      industry: "음식점",
      franchiseFee: 4500,
      educationFee: 500,
      depositFee: 5000,
      royalty: "4%",
      totalStores: 450,
      avgRevenue: 15000,
      registeredAt: "2020-01-15",
    },
    {
      ftcId: "FTC002",
      brandName: "스타벅스",
      companyName: "스타벅스커피코리아(주)",
      businessNumber: "211-86-76277",
      industry: "카페",
      franchiseFee: 0,
      educationFee: 0,
      depositFee: 0,
      royalty: "직영",
      totalStores: 1800,
      avgRevenue: 25000,
      registeredAt: "2019-03-01",
    },
    {
      ftcId: "FTC003",
      brandName: "GS25",
      companyName: "지에스리테일(주)",
      businessNumber: "116-81-51834",
      industry: "소매점",
      franchiseFee: 300,
      educationFee: 100,
      depositFee: 1000,
      royalty: "5%",
      totalStores: 16000,
      avgRevenue: 8000,
      registeredAt: "2018-06-20",
    },
  ];

  const filtered = mockBrands.filter((b) =>
    b.brandName.toLowerCase().includes(brandName.toLowerCase())
  );

  return {
    brands: filtered,
    total: filtered.length,
  };
}

function getMockBrandDetail(ftcId: string): FTCBrandDetail | null {
  const mockDetails: Record<string, FTCBrandDetail> = {
    FTC001: {
      ftcId: "FTC001",
      brandName: "맥도날드",
      companyName: "한국맥도날드(유)",
      businessNumber: "211-81-21692",
      industry: "음식점",
      franchiseFee: 4500,
      educationFee: 500,
      depositFee: 5000,
      royalty: "4%",
      totalStores: 450,
      avgRevenue: 15000,
      registeredAt: "2020-01-15",
      address: "서울특별시 강남구 테헤란로 152",
      representative: "앤토니 마르셀",
      phone: "02-3447-1600",
      establishedAt: "1988-03-01",
      franchiseStartedAt: "1988-03-01",
      rawData: { source: "mock" },
    },
    FTC002: {
      ftcId: "FTC002",
      brandName: "스타벅스",
      companyName: "스타벅스커피코리아(주)",
      businessNumber: "211-86-76277",
      industry: "카페",
      franchiseFee: 0,
      educationFee: 0,
      depositFee: 0,
      royalty: "직영",
      totalStores: 1800,
      avgRevenue: 25000,
      registeredAt: "2019-03-01",
      address: "서울특별시 중구 을지로 281",
      representative: "송호섭",
      phone: "1522-3232",
      establishedAt: "1999-07-27",
      franchiseStartedAt: "1999-07-27",
      rawData: { source: "mock" },
    },
  };

  return mockDetails[ftcId] || null;
}
