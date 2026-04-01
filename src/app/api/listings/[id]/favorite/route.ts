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
  const rl = rateLimitRequest(_req, 30, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다." }, { status: 429 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id: listingId } = await params;

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_listingId: {
        userId: session.user.id,
        listingId,
      },
    },
  });

  if (existing) {
    // 이미 찜 → 해제
    await prisma.$transaction(async (tx) => {
      await tx.favorite.delete({ where: { id: existing.id } });
      await tx.listing.update({
        where: { id: listingId },
        data: { favoriteCount: { decrement: 1 } },
      });

      // Ensure favoriteCount doesn't go below 0
      await tx.listing.updateMany({
        where: { id: listingId, favoriteCount: { lt: 0 } },
        data: { favoriteCount: 0 },
      });
    });

    return NextResponse.json({ favorited: false });
  } else {
    // 찜 추가
    await prisma.$transaction(async (tx) => {
      await tx.favorite.create({
        data: { userId: session.user.id, listingId },
      });
      await tx.listing.update({
        where: { id: listingId },
        data: { favoriteCount: { increment: 1 } },
      });
    });

    // 매물 소유자에게 알림 (비차단)
    (async () => {
      try {
        const listing = await prisma.listing.findUnique({
          where: { id: listingId },
          select: {
            storeName: true,
            addressRoad: true,
            userId: true,
          },
        });

        if (listing && listing.userId !== session.user.id) {
          const storeName = listing.storeName || listing.addressRoad || "매물";

          // DB 알림
          await prisma.notification.create({
            data: {
              userId: listing.userId,
              type: "LISTING_FAVORITED",
              title: "매물 관심 등록",
              message: `"${storeName}" 매물에 관심을 표시한 사용자가 있습니다.`,
              link: `/listings/${listingId}`,
            },
          });

          // 웹 푸시
          sendPushToUser(
            listing.userId,
            "매물 관심 등록",
            `"${storeName}" 매물에 관심을 표시한 사용자가 있습니다.`,
            `/listings/${listingId}`
          ).catch(() => {});
        }
      } catch (error) {
        console.error("[Notification] Failed to send favorite notification:", error);
      }
    })();

    return NextResponse.json({ favorited: true });
  }
}
