/**
 * 매도자 시장분석 리포트 생성기
 * DB 쿼리 + R-ONE API + 상권정보 API 조합
 */

import { prisma } from "@/lib/prisma";
import { getRentalTrends } from "@/lib/api/molit-rental";
import { getCommercialDistrictInfo } from "@/lib/api/small-biz";

// 주소에서 구/군/시 추출
function extractGu(address: string | null): string {
  if (!address) return "";
  const match = address.match(/([\w가-힣]+[구군시])/);
  return match ? match[1] : "";
}

// 주소에서 법정동코드 추출 (간이 매핑)
function getRegionCodeFromAddress(address: string): string {
  const guMap: Record<string, string> = {
    "강남구": "1168000000", "서초구": "1165000000", "송파구": "1171000000",
    "마포구": "1144000000", "영등포구": "1156000000", "종로구": "1111000000",
    "중구": "1114000000", "용산구": "1117000000", "성동구": "1120000000",
    "광진구": "1121500000", "동대문구": "1123000000", "중랑구": "1126000000",
    "성북구": "1129000000", "강북구": "1130500000", "도봉구": "1132000000",
    "노원구": "1135000000", "서대문구": "1141000000", "양천구": "1147000000",
    "강서구": "1150000000", "구로구": "1153000000", "금천구": "1154500000",
    "동작구": "1159000000", "관악구": "1162000000", "강동구": "1174000000",
    "은평구": "1138000000",
  };

  for (const [gu, code] of Object.entries(guMap)) {
    if (address.includes(gu)) return code;
  }
  return "1168000000";
}

interface ListingForReport {
  id: string;
  addressJibun: string | null;
  addressRoad: string | null;
  categoryId: string | null;
  deposit: number;
  monthlyRent: number;
  premium: number;
  premiumNone: boolean;
  viewCount: number;
  favoriteCount: number;
  latitude: number | null;
  longitude: number | null;
  category: { name: string } | null;
  subCategory: { name: string } | null;
  storeName: string | null;
}

export interface SellerReportData {
  generatedAt: string;
  listing: {
    id: string;
    address: string;
    category: string;
    subCategory: string;
    storeName: string;
    deposit: number;
    monthlyRent: number;
    premium: number;
    premiumNone: boolean;
  };
  positioning: {
    rank: number;
    percentile: number;
    totalCompetitors: number;
    pricePosition: string; // "하위", "중위", "상위"
  };
  priceAdequacy: {
    depositDiff: number;
    rentDiff: number;
    premiumDiff: number | null;
    avgDeposit: number;
    avgMonthlyRent: number;
    avgPremium: number;
    verdict: "적정 가격" | "다소 높음" | "매력적 가격";
    verdictColor: "green" | "orange" | "blue";
  };
  competition: {
    count: number;
    avgPremium: number;
    avgDeposit: number;
    recentSold: number;
    recentNew: number;
    intensity: "낮음" | "보통" | "높음";
  };
  marketTrend: {
    vacancyRate: number;
    nationalAvgVacancyRate: number;
    rentChangeRate: number;
    closureRate: number;
    floatingPopulation: string;
    region: string;
    quarter: string;
  };
  strategies: string[];
}

function calculatePricePercentile(
  listingPremium: number,
  premiumNone: boolean,
  competitors: { premium: number; premiumNone: boolean }[]
): { rank: number; percentile: number } {
  if (premiumNone) {
    return { rank: 1, percentile: 0 };
  }

  const prices = competitors
    .filter((c) => !c.premiumNone)
    .map((c) => c.premium)
    .sort((a, b) => a - b);

  if (prices.length === 0) return { rank: 1, percentile: 50 };

  let rank = 1;
  for (const p of prices) {
    if (listingPremium > p) rank++;
    else break;
  }

  const percentile = Math.round((rank / (prices.length + 1)) * 100);
  return { rank, percentile };
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((s, n) => s + n, 0) / nums.length);
}

export async function generateSellerReport(
  listing: ListingForReport
): Promise<SellerReportData> {
  const gu = extractGu(listing.addressJibun || listing.addressRoad);

  // 1. 포지셔닝 분석 - DB 쿼리
  const competitors = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      id: { not: listing.id },
      ...(gu ? { addressJibun: { contains: gu } } : {}),
      ...(listing.categoryId ? { categoryId: listing.categoryId } : {}),
    },
    select: {
      premium: true,
      premiumNone: true,
      deposit: true,
      monthlyRent: true,
      viewCount: true,
      favoriteCount: true,
      createdAt: true,
    },
  });

  const { rank, percentile } = calculatePricePercentile(
    listing.premium,
    listing.premiumNone,
    competitors.map((c) => ({ premium: c.premium, premiumNone: c.premiumNone }))
  );

  let pricePosition: string;
  if (percentile <= 33) pricePosition = "하위";
  else if (percentile <= 66) pricePosition = "중위";
  else pricePosition = "상위";

  // 2. 가격 적정성 - R-ONE API
  const regionCode = getRegionCodeFromAddress(listing.addressJibun || listing.addressRoad || "");
  const rentalTrends = await getRentalTrends(regionCode, listing.category?.name);

  const depositDiff = rentalTrends.avgDeposit > 0
    ? ((listing.deposit - rentalTrends.avgDeposit) / rentalTrends.avgDeposit) * 100
    : 0;
  const rentDiff = rentalTrends.avgMonthlyRent > 0
    ? ((listing.monthlyRent - rentalTrends.avgMonthlyRent) / rentalTrends.avgMonthlyRent) * 100
    : 0;
  const premiumDiff = listing.premiumNone
    ? null
    : rentalTrends.avgPremium > 0
      ? ((listing.premium - rentalTrends.avgPremium) / rentalTrends.avgPremium) * 100
      : 0;

  // 종합 판정
  const avgDiff = [depositDiff, rentDiff, ...(premiumDiff !== null ? [premiumDiff] : [])];
  const overallDiff = average(avgDiff.map(Math.round));

  let verdict: "적정 가격" | "다소 높음" | "매력적 가격";
  let verdictColor: "green" | "orange" | "blue";
  if (overallDiff > 10) {
    verdict = "다소 높음";
    verdictColor = "orange";
  } else if (overallDiff < -10) {
    verdict = "매력적 가격";
    verdictColor = "blue";
  } else {
    verdict = "적정 가격";
    verdictColor = "green";
  }

  // 3. 경쟁 현황
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentSold = await prisma.listing.count({
    where: {
      status: "SOLD",
      ...(gu ? { addressJibun: { contains: gu } } : {}),
      ...(listing.categoryId ? { categoryId: listing.categoryId } : {}),
      updatedAt: { gte: thirtyDaysAgo },
    },
  });

  const recentNew = await prisma.listing.count({
    where: {
      status: "ACTIVE",
      ...(gu ? { addressJibun: { contains: gu } } : {}),
      ...(listing.categoryId ? { categoryId: listing.categoryId } : {}),
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  const competitorDeposits = competitors.map((c) => c.deposit);
  const competitorPremiums = competitors.filter((c) => !c.premiumNone).map((c) => c.premium);

  let intensity: "낮음" | "보통" | "높음";
  if (competitors.length > 20) intensity = "높음";
  else if (competitors.length > 8) intensity = "보통";
  else intensity = "낮음";

  // 4. 상권 트렌드 - 상권정보 API
  let closureRate = 12.0;
  let floatingPopulation = "중";

  if (listing.latitude && listing.longitude) {
    try {
      const commercialData = await getCommercialDistrictInfo(listing.latitude, listing.longitude);
      closureRate = commercialData.closureRate || 12.0;
      floatingPopulation = commercialData.floatingPopulation || "중";
    } catch {
      // fallback already set
    }
  }

  // 5. 매각 전략 제안 (규칙 기반)
  const strategies: string[] = [];

  if (depositDiff > 10) {
    strategies.push(
      `보증금이 지역 평균 대비 ${Math.round(depositDiff)}% 높습니다. 보증금을 낮추면 매수자 접근성이 높아집니다.`
    );
  }
  if (rentDiff > 10) {
    strategies.push(
      `월세가 지역 평균 대비 ${Math.round(rentDiff)}% 높습니다. 월세 조정을 검토해보세요.`
    );
  }
  if (premiumDiff !== null && premiumDiff > 15) {
    strategies.push(
      `권리금이 시세 대비 ${Math.round(premiumDiff)}% 높습니다. 권리금 산정 근거(영업/시설/바닥)를 상세히 기재하면 신뢰도가 올라갑니다.`
    );
  }
  if (premiumDiff !== null && premiumDiff < -15) {
    strategies.push(
      `권리금이 시세 대비 매력적인 수준입니다. "급매" 또는 "무권리" 테마 태그를 활용하면 조회수 증가 효과가 있습니다.`
    );
  }

  const avgViewCount = average(competitors.map((c) => c.viewCount));
  if (listing.viewCount < avgViewCount * 0.7) {
    strategies.push(
      `조회수가 지역 평균 대비 낮습니다. 광고 상품을 구매하면 조회수 2~3배 증가 효과를 기대할 수 있습니다.`
    );
  }

  if (competitors.length > 15) {
    strategies.push(
      `경쟁 매물이 ${competitors.length}건으로 많은 편입니다. 매물 설명을 차별화하고, 사진을 보강하면 관심도를 높일 수 있습니다.`
    );
  }

  if (recentSold > 0) {
    strategies.push(
      `최근 30일간 동일 지역·업종에서 ${recentSold}건이 거래 완료되었습니다. 시장이 활발하므로 적극적으로 매물을 노출하세요.`
    );
  } else {
    strategies.push(
      `최근 30일간 동일 지역·업종 거래 완료 건이 없습니다. 가격 경쟁력 확보가 매각의 핵심입니다.`
    );
  }

  // 최소 3개, 최대 5개
  const finalStrategies = strategies.slice(0, 5);
  if (finalStrategies.length < 3) {
    finalStrategies.push("매물 사진을 10장 이상 등록하면 관심도가 평균 40% 증가합니다.");
    if (finalStrategies.length < 3) {
      finalStrategies.push("매물 설명에 매출 근거와 운영 노하우를 상세히 기재하면 매수자 문의가 증가합니다.");
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    listing: {
      id: listing.id,
      address: listing.addressRoad || listing.addressJibun || "",
      category: listing.category?.name || "기타",
      subCategory: listing.subCategory?.name || "",
      storeName: listing.storeName || "",
      deposit: listing.deposit,
      monthlyRent: listing.monthlyRent,
      premium: listing.premium,
      premiumNone: listing.premiumNone,
    },
    positioning: {
      rank,
      percentile,
      totalCompetitors: competitors.length,
      pricePosition,
    },
    priceAdequacy: {
      depositDiff: Math.round(depositDiff * 10) / 10,
      rentDiff: Math.round(rentDiff * 10) / 10,
      premiumDiff: premiumDiff !== null ? Math.round(premiumDiff * 10) / 10 : null,
      avgDeposit: rentalTrends.avgDeposit,
      avgMonthlyRent: rentalTrends.avgMonthlyRent,
      avgPremium: rentalTrends.avgPremium,
      verdict,
      verdictColor,
    },
    competition: {
      count: competitors.length,
      avgPremium: average(competitorPremiums),
      avgDeposit: average(competitorDeposits),
      recentSold,
      recentNew,
      intensity,
    },
    marketTrend: {
      vacancyRate: rentalTrends.vacancyRate,
      nationalAvgVacancyRate: rentalTrends.nationalAvgVacancyRate,
      rentChangeRate: rentalTrends.rentChangeRate,
      closureRate,
      floatingPopulation,
      region: rentalTrends.region,
      quarter: rentalTrends.quarter,
    },
    strategies: finalStrategies,
  };
}
