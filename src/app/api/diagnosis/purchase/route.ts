import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { generateDiagnosis } from "@/lib/utils/diagnosis-engine";

const purchaseDiagnosisSchema = z.object({
  listingId: z.string().min(1, "매물 ID가 필요합니다."),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: "인증이 필요합니다." } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = purchaseDiagnosisSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: "입력값이 올바르지 않습니다.", details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const { listingId } = parsed.data;

    // 매물 존재 확인 & 판매자 본인 확인
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, sellerId: true },
    });

    if (!listing) {
      return NextResponse.json(
        { error: { message: "매물을 찾을 수 없습니다." } },
        { status: 404 }
      );
    }

    if (listing.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: { message: "본인의 매물만 진단을 요청할 수 있습니다." } },
        { status: 403 }
      );
    }

    // 기존 진단서 중복 확인
    const existing = await prisma.diagnosisReport.findUnique({
      where: { listingId },
    });

    if (existing) {
      return NextResponse.json(
        { error: { message: "이미 진단서가 발급된 매물입니다." } },
        { status: 409 }
      );
    }

    // 진단 엔진 실행
    const report = await generateDiagnosis(listingId);

    return NextResponse.json({ data: report }, { status: 201 });
  } catch (error) {
    console.error("Diagnosis purchase error:", error);
    return NextResponse.json(
      { error: { message: "진단서 생성 중 오류가 발생했습니다." } },
      { status: 500 }
    );
  }
}
