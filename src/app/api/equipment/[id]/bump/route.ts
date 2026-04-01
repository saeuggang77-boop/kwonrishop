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
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true },
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

    // 활성화된 끌어올리기 구매권 확인
    const activeBumpPurchase = await prisma.adPurchase.findFirst({
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

    // 끌어올리기 실행
    const updatedEquipment = await prisma.equipment.update({
      where: { id },
      data: { bumpedAt: new Date() },
      select: {
        id: true,
        bumpedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "집기가 끌어올려졌습니다.",
      bumpedAt: updatedEquipment.bumpedAt,
    });
  } catch (error) {
    console.error("끌어올리기 오류:", error);
    return NextResponse.json(
      { error: "끌어올리기 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
