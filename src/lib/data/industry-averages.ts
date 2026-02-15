/**
 * 업종별 평균 데이터 테이블
 * BusinessCategory enum 키와 매핑
 */
export const INDUSTRY_AVERAGES: Record<
  string,
  {
    name: string;
    avgProfitMargin: number; // 평균 영업이익률 (%)
    avgRoiMonths: number; // 평균 투자회수 기간 (개월)
    premiumMultiplier: number; // 영업권리금 배수 (월수익 × N)
    facilityPerPyeong: number; // 시설권리금 평당 추정 (만원)
  }
> = {
  KOREAN_FOOD: {
    name: "한식",
    avgProfitMargin: 25,
    avgRoiMonths: 24,
    premiumMultiplier: 8,
    facilityPerPyeong: 120,
  },
  CHINESE_FOOD: {
    name: "중식",
    avgProfitMargin: 22,
    avgRoiMonths: 28,
    premiumMultiplier: 7,
    facilityPerPyeong: 130,
  },
  JAPANESE_FOOD: {
    name: "일식",
    avgProfitMargin: 23,
    avgRoiMonths: 26,
    premiumMultiplier: 9,
    facilityPerPyeong: 150,
  },
  WESTERN_FOOD: {
    name: "양식",
    avgProfitMargin: 22,
    avgRoiMonths: 28,
    premiumMultiplier: 8,
    facilityPerPyeong: 140,
  },
  CHICKEN: {
    name: "치킨",
    avgProfitMargin: 28,
    avgRoiMonths: 20,
    premiumMultiplier: 7,
    facilityPerPyeong: 100,
  },
  PIZZA: {
    name: "피자",
    avgProfitMargin: 25,
    avgRoiMonths: 24,
    premiumMultiplier: 7,
    facilityPerPyeong: 110,
  },
  CAFE_BAKERY: {
    name: "카페/베이커리",
    avgProfitMargin: 20,
    avgRoiMonths: 30,
    premiumMultiplier: 10,
    facilityPerPyeong: 160,
  },
  BAR_PUB: {
    name: "주점/호프",
    avgProfitMargin: 30,
    avgRoiMonths: 22,
    premiumMultiplier: 6,
    facilityPerPyeong: 130,
  },
  BUNSIK: {
    name: "분식",
    avgProfitMargin: 30,
    avgRoiMonths: 18,
    premiumMultiplier: 6,
    facilityPerPyeong: 80,
  },
  DELIVERY: {
    name: "배달전문",
    avgProfitMargin: 20,
    avgRoiMonths: 20,
    premiumMultiplier: 5,
    facilityPerPyeong: 70,
  },
  OTHER_FOOD: {
    name: "기타 음식점",
    avgProfitMargin: 24,
    avgRoiMonths: 26,
    premiumMultiplier: 7,
    facilityPerPyeong: 110,
  },
  SERVICE: {
    name: "서비스업",
    avgProfitMargin: 35,
    avgRoiMonths: 20,
    premiumMultiplier: 8,
    facilityPerPyeong: 100,
  },
  RETAIL: {
    name: "도소매",
    avgProfitMargin: 18,
    avgRoiMonths: 30,
    premiumMultiplier: 6,
    facilityPerPyeong: 90,
  },
  ENTERTAINMENT: {
    name: "오락/여가",
    avgProfitMargin: 28,
    avgRoiMonths: 24,
    premiumMultiplier: 7,
    facilityPerPyeong: 120,
  },
  EDUCATION: {
    name: "교육",
    avgProfitMargin: 35,
    avgRoiMonths: 22,
    premiumMultiplier: 8,
    facilityPerPyeong: 100,
  },
  ACCOMMODATION: {
    name: "숙박",
    avgProfitMargin: 25,
    avgRoiMonths: 36,
    premiumMultiplier: 10,
    facilityPerPyeong: 180,
  },
  OTHER: {
    name: "기타",
    avgProfitMargin: 25,
    avgRoiMonths: 26,
    premiumMultiplier: 7,
    facilityPerPyeong: 100,
  },
};

/** Default fallback for unknown categories */
export const DEFAULT_INDUSTRY = {
  name: "기타",
  avgProfitMargin: 25,
  avgRoiMonths: 26,
  premiumMultiplier: 7,
  facilityPerPyeong: 100,
};
