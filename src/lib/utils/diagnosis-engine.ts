import { prisma } from "@/lib/prisma";
import {
  INDUSTRY_AVERAGES,
  DEFAULT_INDUSTRY,
} from "@/lib/data/industry-averages";

/**
 * 권리진단 엔진 - 매물의 권리금, 수익성, 입지, 리스크를 종합 분석하여 진단서를 생성
 */
export async function generateDiagnosis(listingId: string) {
  // ── 1. 데이터 조회 ──────────────────────────────────────────
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    throw new Error("매물을 찾을 수 없습니다.");
  }

  const [marketPrice, competitorCount, existingCount] = await Promise.all([
    prisma.marketPrice.findFirst({
      where: {
        subRegion: listing.district,
        businessType: listing.businessCategory,
      },
    }),
    prisma.listing.count({
      where: {
        district: listing.district,
        businessCategory: listing.businessCategory,
        status: "ACTIVE",
        id: { not: listingId },
      },
    }),
    prisma.diagnosisReport.count(),
  ]);

  // ── 2. 업종 평균 ──────────────────────────────────────────
  const industry =
    INDUSTRY_AVERAGES[listing.businessCategory] ?? DEFAULT_INDUSTRY;

  // ── 3. 적정 권리금 산출 ────────────────────────────────────
  const fairPremiumBusiness =
    Number(listing.monthlyProfit ?? BigInt(0)) * industry.premiumMultiplier;

  const pyeong =
    listing.areaPyeong ?? (listing.areaM2 ? listing.areaM2 / 3.3058 : 10);
  const fairPremiumFacility = Math.round(
    pyeong * industry.facilityPerPyeong * 10000
  ); // 평당 × 만원 → 원

  const fairPremiumFloor = marketPrice
    ? Number(marketPrice.avgKeyMoney)
    : 30000000; // fallback 3천만

  const fairPremiumTotal =
    fairPremiumBusiness + fairPremiumFacility + fairPremiumFloor;

  // ── 4. 권리금 괴리율 ──────────────────────────────────────
  const actualPremium = Number(listing.premiumFee ?? BigInt(0));
  const premiumGap =
    fairPremiumTotal > 0
      ? ((actualPremium - fairPremiumTotal) / fairPremiumTotal) * 100
      : 0;

  let premiumVerdict: string;
  if (premiumGap <= -10) {
    premiumVerdict = "저평가";
  } else if (premiumGap <= 10) {
    premiumVerdict = "적정";
  } else if (premiumGap <= 25) {
    premiumVerdict = "다소 높음";
  } else {
    premiumVerdict = "매우 높음";
  }

  // ── 5. 수익성 분석 ────────────────────────────────────────
  const monthlyRevenue = Number(listing.monthlyRevenue ?? BigInt(0));
  const monthlyProfit = Number(listing.monthlyProfit ?? BigInt(0));

  const profitMargin =
    monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0;
  const avgProfitMargin = industry.avgProfitMargin;

  const totalInvestment = Number(listing.price) + actualPremium;
  const roiMonths =
    monthlyProfit > 0 ? Math.round(totalInvestment / monthlyProfit) : 999;
  const avgRoiMonths = industry.avgRoiMonths;

  let profitRating: number;
  if (profitMargin >= avgProfitMargin * 1.3) {
    profitRating = 5;
  } else if (profitMargin >= avgProfitMargin * 1.1) {
    profitRating = 4;
  } else if (profitMargin >= avgProfitMargin * 0.9) {
    profitRating = 3;
  } else if (profitMargin >= avgProfitMargin * 0.7) {
    profitRating = 2;
  } else {
    profitRating = 1;
  }

  // ── 6. 입지 분석 ──────────────────────────────────────────
  let competitorDensity: string;
  if (competitorCount <= 3) {
    competitorDensity = "낮음";
  } else if (competitorCount <= 8) {
    competitorDensity = "보통";
  } else {
    competitorDensity = "높음";
  }

  const stationDistance = listing.address.includes("역")
    ? "역세권 (도보 5분 이내 추정)"
    : "비역세권";

  let footTraffic: string;
  if (marketPrice) {
    const avgMonthlySales = Number(marketPrice.avgMonthlySales);
    if (avgMonthlySales > 50000000) {
      footTraffic = "매우 많음";
    } else if (avgMonthlySales > 30000000) {
      footTraffic = "많음";
    } else if (avgMonthlySales > 15000000) {
      footTraffic = "보통";
    } else {
      footTraffic = "적음";
    }
  } else {
    footTraffic = "정보없음";
  }

  let locationRating: number;
  if (competitorCount <= 3 && stationDistance.includes("역세권")) {
    locationRating = 5;
  } else if (competitorCount <= 5 || stationDistance.includes("역세권")) {
    locationRating = 4;
  } else if (competitorCount <= 8) {
    locationRating = 3;
  } else if (competitorCount <= 12) {
    locationRating = 2;
  } else {
    locationRating = 1;
  }

  // ── 7. 리스크 분석 ────────────────────────────────────────
  const leaseRemaining = "정보없음";
  const buildingAge = "정보없음";
  const premiumProtection = true;
  const riskRating = 3; // default

  // ── 8. 종합 등급 ──────────────────────────────────────────
  const weightedScore =
    profitRating * 0.4 + locationRating * 0.3 + riskRating * 0.3;

  let overallGrade: string;
  if (weightedScore >= 4.5) {
    overallGrade = "A+";
  } else if (weightedScore >= 4.0) {
    overallGrade = "A";
  } else if (weightedScore >= 3.5) {
    overallGrade = "A-";
  } else if (weightedScore >= 3.0) {
    overallGrade = "B+";
  } else if (weightedScore >= 2.5) {
    overallGrade = "B";
  } else if (weightedScore >= 2.0) {
    overallGrade = "B-";
  } else {
    overallGrade = "C";
  }

  let overallComment: string;
  if (overallGrade === "A+" || overallGrade === "A") {
    overallComment =
      "투자 매력도가 높은 우수 매물입니다. 수익성과 입지 조건이 뛰어납니다.";
  } else if (overallGrade === "A-") {
    overallComment =
      "전반적으로 양호한 매물입니다. 일부 보완이 필요한 부분이 있습니다.";
  } else if (overallGrade === "B+") {
    overallComment =
      "평균 수준의 매물입니다. 권리금 협상을 통해 투자 가치를 높일 수 있습니다.";
  } else if (overallGrade === "B") {
    overallComment =
      "보통 수준의 매물입니다. 신중한 검토가 필요합니다.";
  } else {
    // B- or C
    overallComment =
      "투자 리스크가 있는 매물입니다. 전문가 상담을 권장합니다.";
  }

  // ── 9. 진단 번호 생성 ─────────────────────────────────────
  const diagnosisNumber = `KR-${new Date().getFullYear()}-${String(
    existingCount + 1
  ).padStart(4, "0")}`;

  // ── 10. 트랜잭션으로 저장 ─────────────────────────────────
  const report = await prisma.$transaction(async (tx) => {
    const created = await tx.diagnosisReport.create({
      data: {
        listingId,
        fairPremiumBusiness: Math.round(fairPremiumBusiness),
        fairPremiumFacility,
        fairPremiumFloor,
        fairPremiumTotal: Math.round(fairPremiumTotal),
        premiumGap: Math.round(premiumGap * 100) / 100,
        premiumVerdict,
        profitMargin: Math.round(profitMargin * 100) / 100,
        avgProfitMargin,
        roiMonths,
        avgRoiMonths,
        profitRating,
        footTraffic,
        competitorDensity,
        stationDistance,
        locationRating,
        leaseRemaining,
        buildingAge,
        premiumProtection,
        riskRating,
        overallGrade,
        overallComment,
        diagnosisNumber,
      },
    });

    await tx.listing.update({
      where: { id: listingId },
      data: { hasDiagnosisBadge: true },
    });

    return created;
  });

  // ── 11. 결과 반환 ─────────────────────────────────────────
  return report;
}
