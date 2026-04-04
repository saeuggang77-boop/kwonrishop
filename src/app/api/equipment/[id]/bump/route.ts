import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateOrigin } from "@/lib/csrf";
import { rateLimitRequest } from "@/lib/rate-limit";

// 끌어올리기
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const rl = rateLimitRequest(req, 5, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다." }, { status: 429 });
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;

  try {
    // 집기 조회 및 소유권 확인
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true, bumpedAt: true },
    });

    if (!equipment) {
      return NextResponse.json(
        { error: "집기를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (equipment.userId !== session.user.id) {
      return NextResponse.json(
        { error: "본인의 집기만 끌어올릴 수 있습니다." },
        { status: 403 }
      );
    }

    if (equipment.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "활성 상태의 집기만 끌어올릴 수 있습니다." },
        { status: 400 }
      );
    }

    // 끌어올리기 24시간 쿨다운 체크
    if (equipment.bumpedAt) {
      const hoursSinceLastBump = (Date.now() - new Date(equipment.bumpedAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastBump < 24) {
        const remainingHours = Math.ceil(24 - hoursSinceLastBump);
        return NextResponse.json({
          error: `끌어올리기는 24시간에 1회만 가능합니다. ${remainingHours}시간 후 다시 시도해주세요.`,
          remainingHours,
        }, { status: 429 });
      }
    }

    // 1. 먼저 SINGLE 타입 끌어올리기 구매권 확인
    let activeBumpPurchase = await prisma.adPurchase.findFirst({
      where: {
        userId: session.user.id,
        equipmentId: id,
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
          select: { name: true, type: true, features: true },
        },
      },
    });

    let isPackageBump = false;

    // 2. SINGLE이 없으면 PACKAGE 타입 구매권 확인
    if (!activeBumpPurchase) {
      const packagePurchases = await prisma.adPurchase.findMany({
        where: {
          userId: session.user.id,
          equipmentId: id,
          status: "PAID",
          expiresAt: {
            gte: new Date(),
          },
          product: {
            type: "PACKAGE",
            categoryScope: "EQUIPMENT",
          },
        },
        include: {
          product: {
            select: { name: true, type: true, features: true },
          },
        },
      });

      // bumpCount가 있고 아직 사용 가능한 구매권 찾기
      for (const purchase of packagePurchases) {
        const features = purchase.product.features as { bumpCount?: number };
        const bumpCount = features.bumpCount || 0;

        if (bumpCount > 0 && purchase.bumpUsedCount < bumpCount) {
          activeBumpPurchase = purchase;
          isPackageBump = true;
          break;
        }
      }
    }

    // 3. 둘 다 없으면 에러
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

    // 4. 끌어올리기 실행
    await prisma.$transaction(async (tx) => {
      // 집기 bumpedAt 업데이트
      await tx.equipment.update({
        where: { id },
        data: { bumpedAt: new Date() },
      });

      if (isPackageBump) {
        // PACKAGE: bumpUsedCount 증가 (만료하지 않음)
        const features = activeBumpPurchase.product.features as { bumpCount?: number };
        const bumpCount = features.bumpCount || 0;
        const newUsedCount = activeBumpPurchase.bumpUsedCount + 1;

        await tx.adPurchase.update({
          where: { id: activeBumpPurchase.id },
          data: {
            bumpUsedCount: newUsedCount,
            // 모든 횟수를 사용한 경우에만 만료 처리
            ...(newUsedCount >= bumpCount ? {
              status: "EXPIRED",
              expiresAt: new Date(),
            } : {}),
          },
        });
      } else {
        // SINGLE: 1회 사용 후 즉시 만료
        await tx.adPurchase.update({
          where: { id: activeBumpPurchase.id },
          data: {
            status: "EXPIRED",
            expiresAt: new Date(),
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "집기가 끌어올려졌습니다.",
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
