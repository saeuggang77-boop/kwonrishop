import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const createOfferSchema = z.object({
  offerAmount: z.number().int().positive("제안 금액을 입력해주세요."),
  reason: z.string().min(5, "제안 사유는 5자 이상 입력해주세요.").max(1000),
});

// ---------------------------------------------------------------------------
// POST /api/listings/[id]/premium-offers — 권리금 제안 등록
// ---------------------------------------------------------------------------
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id: listingId } = await params;

  try {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, sellerId: true, status: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "매물을 찾을 수 없습니다." }, { status: 404 });
    }

    if (listing.sellerId === session.user.id) {
      return NextResponse.json({ error: "본인 매물에는 제안할 수 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createOfferSchema.parse(body);

    const offer = await prisma.premiumOffer.create({
      data: {
        listingId,
        userId: session.user.id,
        offerAmount: parsed.offerAmount,
        reason: parsed.reason,
      },
    });

    return NextResponse.json(offer, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[premium-offers] POST error:", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// GET /api/listings/[id]/premium-offers — 권리금 제안 목록 (매물 소유자만)
// ---------------------------------------------------------------------------
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
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { sellerId: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "매물을 찾을 수 없습니다." }, { status: 404 });
    }

    if (listing.sellerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "매물 소유자만 제안 목록을 조회할 수 있습니다." }, { status: 403 });
    }

    const offers = await prisma.premiumOffer.findMany({
      where: { listingId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(offers);
  } catch (err) {
    console.error("[premium-offers] GET error:", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
