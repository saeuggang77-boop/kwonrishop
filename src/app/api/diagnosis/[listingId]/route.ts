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

    const report = await prisma.diagnosisReport.findUnique({
      where: { listingId },
    });

    if (!report) {
      return NextResponse.json(
        { error: { message: "해당 매물의 진단서를 찾을 수 없습니다." } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: report });
  } catch (error) {
    console.error("Diagnosis fetch error:", error);
    return NextResponse.json(
      { error: { message: "진단서 조회 중 오류가 발생했습니다." } },
      { status: 500 }
    );
  }
}
