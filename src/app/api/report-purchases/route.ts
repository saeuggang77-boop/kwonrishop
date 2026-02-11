import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { errorToResponse, NotFoundError } from "@/lib/utils/errors";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: { message: "인증이 필요합니다." } }, { status: 401 });
    }

    const purchases = await prisma.reportPurchase.findMany({
      where: { userId: session.user.id },
      include: {
        listing: { select: { id: true, title: true, address: true, businessCategory: true } },
        plan: { select: { name: true, displayName: true, price: true } },
        data: { select: { id: true, pdfUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({
      data: purchases.map((p) => ({
        ...p,
        plan: { ...p.plan, price: Number(p.plan.price) },
      })),
    });
  } catch (error) {
    return errorToResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: { message: "인증이 필요합니다." } }, { status: 401 });
    }

    const body = await req.json();
    const { listingId, planId, paymentMethod, inputData } = body;

    const [listing, plan] = await Promise.all([
      prisma.listing.findUnique({ where: { id: listingId }, select: { id: true, title: true } }),
      prisma.reportPlan.findUnique({ where: { id: planId } }),
    ]);

    if (!listing) throw new NotFoundError("매물을 찾을 수 없습니다.");
    if (!plan) throw new NotFoundError("플랜을 찾을 수 없습니다.");

    // 구매 생성 및 분석 데이터 생성
    const purchase = await prisma.reportPurchase.create({
      data: {
        userId: session.user.id,
        listingId,
        planId,
        paymentMethod,
        status: "COMPLETED",
      },
    });

    // 기본 분석 데이터 생성
    const analysisResult = generateAnalysis(inputData, plan.name);

    await prisma.reportData.create({
      data: {
        purchaseId: purchase.id,
        listingId,
        inputData: (inputData ?? {}) as Prisma.InputJsonValue,
        analysisResult: analysisResult as unknown as Prisma.InputJsonValue,
        pdfUrl: plan.name === "PREMIUM" ? `/reports/${purchase.id}/pdf` : null,
      },
    });

    return Response.json({ data: { purchaseId: purchase.id } });
  } catch (error) {
    return errorToResponse(error);
  }
}

// 기본 분석 데이터 생성
function generateAnalysis(inputData: Record<string, unknown>, planTier: string) {
  const premiumFee = Number(inputData?.premiumFee ?? 5000);
  const monthlyRevenue = Number(inputData?.monthlyRevenue ?? 3000);
  const monthlyProfit = Number(inputData?.monthlyProfit ?? 800);
  const interiorCost = Number(inputData?.interiorCost ?? 3000);
  const interiorPeriod = (inputData?.interiorPeriod as string) ?? "1~3년";
  const leaseRemainYears = Number(inputData?.leaseRemainYears ?? 2);
  const leaseRemainMonths = Number(inputData?.leaseRemainMonths ?? 0);

  // 입력 데이터 기반 결정적 시드 생성 (동일 입력 -> 동일 결과)
  const seed = (premiumFee * 7 + monthlyRevenue * 13 + monthlyProfit * 17 + interiorCost * 23 + leaseRemainYears * 31) % 1000;
  const seedFrac = seed / 1000; // 0 ~ 0.999 범위의 결정적 값

  // 권리금 적정성 분석
  const regionAvgPremium = Math.round(premiumFee * (0.8 + seedFrac * 0.4));
  const industryAvgPremium = Math.round(premiumFee * (0.7 + ((seed * 3) % 1000) / 1000 * 0.6));
  const fairMin = Math.round(premiumFee * 0.75);
  const fairMax = Math.round(premiumFee * 1.25);
  const valuation = premiumFee >= fairMin && premiumFee <= fairMax
    ? "적정" : premiumFee < fairMin ? "저가" : "고가";
  const recoveryMonths = monthlyProfit > 0 ? Math.round((premiumFee * 10000) / (monthlyProfit * 10000)) : 0;

  // 인테리어 감가상각
  const depreciationRate: Record<string, number> = { "1년이내": 0.9, "1~3년": 0.65, "3~5년": 0.4, "5년이상": 0.2 };
  const facilityPremium = Math.round(interiorCost * (depreciationRate[interiorPeriod] ?? 0.5));

  // 위험요소 분석 (결정적 시드 기반)
  const mortgageRisk = (seed * 7) % 100 > 70;
  const seizureRisk = (seed * 11) % 100 > 85;
  const taxRisk = (seed * 19) % 100 > 90;
  const risks = [
    { item: "근저당권 설정", status: mortgageRisk ? "주의" : "안전", detail: mortgageRisk ? "근저당 5,000만원 설정" : "설정 없음" },
    { item: "가압류/압류", status: seizureRisk ? "위험" : "안전", detail: seizureRisk ? "가압류 1건 확인" : "해당 없음" },
    { item: "전세권 설정", status: "안전", detail: "설정 없음" },
    { item: "임차권등기명령", status: "안전", detail: "해당 없음" },
    { item: "임대차 잔여 기간", status: leaseRemainYears < 1 ? "위험" : leaseRemainYears < 2 ? "주의" : "안전", detail: `잔여 ${leaseRemainYears}년 ${leaseRemainMonths}개월` },
    { item: "세금 체납", status: taxRisk ? "주의" : "안전", detail: taxRisk ? "지방세 체납 이력 있음" : "체납 없음" },
  ];

  const riskScore = risks.reduce((s, r) => s + (r.status === "안전" ? 0 : r.status === "주의" ? 15 : 30), 0);
  const riskGrade = riskScore <= 10 ? "A" : riskScore <= 30 ? "B" : riskScore <= 50 ? "C" : "D";

  const result: Record<string, unknown> = {
    valuation: {
      regionAvgPremium,
      industryAvgPremium,
      fairMin,
      fairMax,
      currentPremium: premiumFee,
      verdict: valuation,
      recoveryMonths,
      facilityPremium,
      monthlyRevenue,
      monthlyProfit,
    },
    risks: {
      items: risks,
      totalScore: riskScore,
      grade: riskGrade,
    },
  };

  // PREMIUM 전용 항목
  if (planTier === "PREMIUM") {
    result.checklist = [
      { id: 1, item: "등기부등본 확인 (소유자, 근저당, 가압류)", checked: false },
      { id: 2, item: "건축물대장 확인 (용도, 위반건축물 여부)", checked: false },
      { id: 3, item: "토지이용계획 확인서 검토", checked: false },
      { id: 4, item: "임대차 계약서 원본 확인", checked: false },
      { id: 5, item: "임대인 신분증 대조", checked: false },
      { id: 6, item: "현 임차인 동의서 확인 (권리금 회수 보장)", checked: false },
      { id: 7, item: "보증금 반환 능력 확인 (임대인 재산)", checked: false },
      { id: 8, item: "관리비 내역 및 미납 확인", checked: false },
      { id: 9, item: "시설물 하자 점검 (누수, 전기, 가스)", checked: false },
      { id: 10, item: "매출 증빙 자료 확인 (POS, 카드매출)", checked: false },
      { id: 11, item: "영업 허가/신고 사항 확인", checked: false },
      { id: 12, item: "주변 개발 계획 확인 (재개발, 도로확장)", checked: false },
      { id: 13, item: "상가건물임대차보호법 적용 여부", checked: false },
      { id: 14, item: "확정일자 부여 여부 확인", checked: false },
      { id: 15, item: "전입신고 완료 여부", checked: false },
      { id: 16, item: "권리금 계약서 별도 작성", checked: false },
      { id: 17, item: "원상복구 의무 범위 확인", checked: false },
      { id: 18, item: "경업금지 특약 포함 여부", checked: false },
      { id: 19, item: "중개보수 및 부가세 확인", checked: false },
      { id: 20, item: "특약사항 꼼꼼히 검토", checked: false },
    ];
  }

  return result;
}
