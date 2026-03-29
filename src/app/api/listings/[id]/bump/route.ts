import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateOrigin } from "@/lib/csrf";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// 끌어올리기
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rl = rateLimit(ip, 5, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다." }, { status: 429 });
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;

  try {
    // 매물 조회 및 소유권 확인
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true, bumpedAt: true },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "매물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (listing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "본인의 매물만 끌어올릴 수 있습니다." },
        { status: 403 }
      );
    }

    if (listing.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "활성 상태의 매물만 끌어올릴 수 있습니다." },
        { status: 400 }
      );
    }

    // 끌어올리기 24시간 쿨다운 체크
    if (listing.bumpedAt) {
      const hoursSinceLastBump = (Date.now() - new Date(listing.bumpedAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastBump < 24) {
        const remainingHours = Math.ceil(24 - hoursSinceLastBump);
        return NextResponse.json({
          error: `끌어올리기는 24시간에 1회만 가능합니다. ${remainingHours}시간 후 다시 시도해주세요.`,
          remainingHours,
        }, { status: 429 });
      }
    }

    // 활성화된 끌어올리기 구매권 확인
    const activeBumpPurchase = await prisma.adPurchase.findFirst({
      where: {
        userId: session.user.id,
        listingId: id,
        status: "PAID",
        expiresAt: {
          gte: new Date(),
        },
        product: {
          type: "SINGLE",
        },
      },
      include: {
        product: {
          select: { name: true },
        },
      },
    });

    if (!activeBumpPurchase) {
      return NextResponse.json(
        {
          error: "끌어올리기 구매가 필요합니다.",
          message: "끌어올리기를 사용하려면 먼저 상품을 구매해주세요.",
          needsPurchase: true,
        },
        { status: 403 }
      );
    }

    // 끌어올리기 실행 (단건 구매는 1회 사용 후 만료 처리)
    await prisma.$transaction(async (tx) => {
      // 매물 bumpedAt 업데이트
      await tx.listing.update({
        where: { id },
        data: { bumpedAt: new Date() },
      });

      // 단건 구매권 사용처리 (EXPIRED로 변경하여 재사용 방지)
      await tx.adPurchase.update({
        where: { id: activeBumpPurchase.id },
        data: {
          status: "EXPIRED",
          expiresAt: new Date(), // 즉시 만료
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "매물이 끌어올려졌습니다.",
      bumpedAt: new Date(),
    });
  } catch (error) {
    console.error("끌어올리기 오류:", error);
    return NextResponse.json(
      { error: "끌어올리기 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
