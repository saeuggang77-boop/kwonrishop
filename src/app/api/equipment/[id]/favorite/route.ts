import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { validateOrigin } from "@/lib/csrf";
import { rateLimitRequest } from "@/lib/rate-limit";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!validateOrigin(_req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const rateLimitError = await rateLimitRequest(_req, 30, 60000);
  if (rateLimitError) return rateLimitError;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id: equipmentId } = await params;

  const existing = await prisma.equipmentFavorite.findUnique({
    where: {
      userId_equipmentId: {
        userId: session.user.id,
        equipmentId,
      },
    },
  });

  if (existing) {
    // 이미 찜 → 해제
    await prisma.$transaction(async (tx) => {
      await tx.equipmentFavorite.delete({ where: { id: existing.id } });
      await tx.equipment.update({
        where: { id: equipmentId },
        data: { favoriteCount: { decrement: 1 } },
      });

      // Ensure favoriteCount doesn't go below 0
      await tx.equipment.updateMany({
        where: { id: equipmentId, favoriteCount: { lt: 0 } },
        data: { favoriteCount: 0 },
      });
    });

    return NextResponse.json({ favorited: false });
  } else {
    // 찜 추가
    await prisma.$transaction(async (tx) => {
      await tx.equipmentFavorite.create({
        data: { userId: session.user.id, equipmentId },
      });
      await tx.equipment.update({
        where: { id: equipmentId },
        data: { favoriteCount: { increment: 1 } },
      });
    });

    // 집기 소유자에게 알림 (비차단)
    (async () => {
      try {
        const equipment = await prisma.equipment.findUnique({
          where: { id: equipmentId },
          select: { title: true, userId: true },
        });

        if (equipment && equipment.userId !== session.user.id) {
          await prisma.notification.create({
            data: {
              userId: equipment.userId,
              type: "EQUIPMENT_FAVORITED",
              title: "집기 관심 등록",
              message: `"${equipment.title}" 집기에 관심을 표시한 사용자가 있습니다.`,
              link: `/equipment/${equipmentId}`,
            },
          });

          // 웹 푸시
          sendPushToUser(
            equipment.userId,
            "집기 관심 등록",
            `"${equipment.title}" 집기에 관심을 표시한 사용자가 있습니다.`,
            `/equipment/${equipmentId}`
          ).catch(() => {});
        }
      } catch (error) {
        console.error("[Notification] Failed to create favorite notification:", error);
      }
    })();

    return NextResponse.json({ favorited: true });
  }
}
