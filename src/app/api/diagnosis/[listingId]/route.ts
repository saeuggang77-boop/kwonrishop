import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const { listingId } = await params;

    if (!listingId) {
      return NextResponse.json(
        { error: { message: "매물 ID가 필요합니다." } },
        { status: 400 }
      );
    }

    const [report, listing] = await Promise.all([
      prisma.diagnosisReport.findUnique({ where: { listingId } }),
      prisma.listing.findUnique({
        where: { id: listingId },
        select: { premiumFee: true, monthlyRevenue: true, monthlyProfit: true },
      }),
    ]);

    if (!report) {
      return NextResponse.json(
        { error: { message: "해당 매물의 진단서를 찾을 수 없습니다." } },
        { status: 404 }
      );
    }

    // Convert BigInt fields to strings for JSON serialization
    return NextResponse.json({
      data: {
        ...report,
        premiumFee: listing?.premiumFee ? String(listing.premiumFee) : "0",
        monthlyRevenue: listing?.monthlyRevenue ? String(listing.monthlyRevenue) : "0",
        monthlyProfit: listing?.monthlyProfit ? String(listing.monthlyProfit) : "0",
      },
    });
  } catch (error) {
    console.error("Diagnosis fetch error:", error);
    return NextResponse.json(
      { error: { message: "진단서 조회 중 오류가 발생했습니다." } },
      { status: 500 }
    );
  }
}
