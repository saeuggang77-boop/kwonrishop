/**
 * DiagnosisReport 시드 스크립트
 * hasDiagnosisBadge: true인 매물에 DiagnosisReport 레코드를 생성합니다.
 *
 * 사용법: npx tsx scripts/seed-diagnosis.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://kwonrishop:kwonrishop_dev@localhost:5432/kwonrishop";

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const listings = await prisma.listing.findMany({
    where: { hasDiagnosisBadge: true },
    select: { id: true, title: true },
    take: 10,
  });

  console.log(`hasDiagnosisBadge 매물: ${listings.length}개`);

  if (listings.length === 0) {
    console.log("대상 매물이 없습니다.");
    return;
  }

  const diagnosisData = [
    {
      fairPremiumBusiness: 45000000,
      fairPremiumFacility: 25000000,
      fairPremiumFloor: 30000000,
      fairPremiumTotal: 100000000,
      premiumGap: 5.2,
      premiumVerdict: "적정",
      profitMargin: 22.5,
      avgProfitMargin: 18.0,
      roiMonths: 18,
      avgRoiMonths: 24,
      profitRating: 4,
      footTraffic: "많음",
      competitorDensity: "보통",
      stationDistance: "역세권 (도보 5분 이내 추정)",
      locationRating: 4,
      leaseRemaining: "36개월",
      buildingAge: "8년",
      premiumProtection: true,
      riskRating: 4,
      overallGrade: "A-",
      overallComment: "전반적으로 양호한 매물입니다. 수익성이 업종 평균을 상회하며, 역세권 입지 조건이 우수합니다.",
      diagnosisNumber: "KR-2026-0001",
    },
    {
      fairPremiumBusiness: 35000000,
      fairPremiumFacility: 20000000,
      fairPremiumFloor: 25000000,
      fairPremiumTotal: 80000000,
      premiumGap: 12.8,
      premiumVerdict: "다소 높음",
      profitMargin: 15.3,
      avgProfitMargin: 18.0,
      roiMonths: 28,
      avgRoiMonths: 24,
      profitRating: 3,
      footTraffic: "보통",
      competitorDensity: "높음",
      stationDistance: "비역세권",
      locationRating: 2,
      leaseRemaining: "18개월",
      buildingAge: "15년",
      premiumProtection: true,
      riskRating: 3,
      overallGrade: "B",
      overallComment: "보통 수준의 매물입니다. 권리금이 다소 높은 편이며, 경쟁 밀도가 높아 신중한 검토가 필요합니다.",
      diagnosisNumber: "KR-2026-0002",
    },
  ];

  for (let i = 0; i < listings.length && i < diagnosisData.length; i++) {
    const listing = listings[i];
    const data = { ...diagnosisData[i], listingId: listing.id };

    await prisma.diagnosisReport.upsert({
      where: { listingId: listing.id },
      update: data,
      create: data,
    });
    console.log(`  ✓ ${listing.title} → ${data.overallGrade} (${data.diagnosisNumber})`);
  }

  console.log("\nDiagnosisReport 시드 완료!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
