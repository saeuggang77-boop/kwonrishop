import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/listings/[id]/premium-offers/mine — 내가 보낸 제안 조회
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id: listingId } = await params;

  try {
    const offer = await prisma.premiumOffer.findFirst({
      where: { listingId, userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    if (!offer) {
      return NextResponse.json(null);
    }

    return NextResponse.json(offer);
  } catch (err) {
    console.error("[premium-offers/mine] GET error:", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
