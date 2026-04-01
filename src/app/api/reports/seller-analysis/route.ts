import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateOrigin } from "@/lib/csrf";
import { rateLimitRequest } from "@/lib/rate-limit";
import { generateSellerReport } from "@/lib/report-generator";

/**
 * GET /api/reports/seller-analysis?listingId=xxx
 * 기존 구매한 리포트가 있으면 반환, 없으면 needsPurchase 응답
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const listingId = request.nextUrl.searchParams.get("listingId");
    if (!listingId) {
      return NextResponse.json({ error: "listingId가 필요합니다" }, { status: 400 });
    }

    // 매물 소유자 확인
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "매물을 찾을 수 없습니다" }, { status: 404 });
    }

    if (listing.userId !== session.user.id) {
      return NextResponse.json({ error: "본인 매물만 분석할 수 있습니다" }, { status: 403 });
    }

    // 기존 리포트 확인
    const existingReport = await prisma.sellerReport.findFirst({
      where: {
        userId: session.user.id,
        listingId,
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingReport) {
      return NextResponse.json({
        hasReport: true,
        report: existingReport,
      });
    }

    // 리포트 없음 - 상품 정보 반환
    const product = await prisma.adProduct.findFirst({
      where: {
        active: true,
        features: { path: ["scope"], equals: "SELLER_REPORT" },
      },
    });

    return NextResponse.json({
      hasReport: false,
      needsPurchase: true,
      productId: product?.id || null,
      productPrice: product?.price || 15000,
      productName: product?.name || "매도자 시장분석 리포트",
    });
  } catch (error) {
    console.error("Seller analysis GET error:", error);
    return NextResponse.json(
      { error: "리포트 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports/seller-analysis
 * 결제 완료 후 호출하여 리포트 생성
 * body: { listingId, adPurchaseId }
 */
export async function POST(request: NextRequest) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const rl = rateLimitRequest(request, 5, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다." }, { status: 429 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { listingId, adPurchaseId } = await request.json();

    if (!listingId || !adPurchaseId) {
      return NextResponse.json(
        { error: "listingId와 adPurchaseId가 필요합니다" },
        { status: 400 }
      );
    }

    // 결제 확인
    const purchase = await prisma.adPurchase.findUnique({
      where: { id: adPurchaseId },
      include: { product: true },
    });

    if (!purchase) {
      return NextResponse.json({ error: "결제 정보를 찾을 수 없습니다" }, { status: 404 });
    }

    if (purchase.userId !== session.user.id) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    if (purchase.status !== "PAID") {
      return NextResponse.json({ error: "결제가 완료되지 않았습니다" }, { status: 400 });
    }

    // 이미 생성된 리포트 확인
    const existing = await prisma.sellerReport.findUnique({
      where: { adPurchaseId },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        report: existing,
      });
    }

    // 매물 정보 조회
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        category: { select: { name: true } },
        subCategory: { select: { name: true } },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "매물을 찾을 수 없습니다" }, { status: 404 });
    }

    if (listing.userId !== session.user.id) {
      return NextResponse.json({ error: "본인 매물만 분석할 수 있습니다" }, { status: 403 });
    }

    // 리포트 생성
    const reportData = await generateSellerReport(listing);

    // DB 저장
    const sellerReport = await prisma.sellerReport.create({
      data: {
        userId: session.user.id,
        listingId,
        adPurchaseId,
        reportData: reportData as any,
      },
    });

    return NextResponse.json({
      success: true,
      report: sellerReport,
    });
  } catch (error) {
    console.error("Seller analysis POST error:", error);
    return NextResponse.json(
      { error: "리포트 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
