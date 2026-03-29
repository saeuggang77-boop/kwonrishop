import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateNextBumpTime } from "@/lib/bump-utils";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json({ error: "Cron not configured" }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Find active bump subscriptions that are due for execution
    const dueSubscriptions = await prisma.bumpSubscription.findMany({
      where: {
        status: "ACTIVE",
        nextBumpAt: {
          lte: now,
        },
        expiresAt: {
          gt: now, // Not yet expired
        },
      },
      select: {
        id: true,
        userId: true,
        listingId: true,
        equipmentId: true,
        frequency: true,
        bumpTimes: true,
        nextBumpAt: true,
        expiresAt: true,
        listing: {
          select: {
            storeName: true,
            addressRoad: true,
          },
        },
        equipment: {
          select: {
            title: true,
          },
        },
      },
    });

    let bumpedCount = 0;
    const errors: string[] = [];

    // Process each due subscription
    for (const sub of dueSubscriptions) {
      try {
        const targetName = sub.listing?.storeName || sub.listing?.addressRoad || sub.equipment?.title || "매물";

        // Update listing or equipment bumpedAt
        if (sub.listingId) {
          await prisma.listing.update({
            where: { id: sub.listingId },
            data: { bumpedAt: now },
          });
        } else if (sub.equipmentId) {
          await prisma.equipment.update({
            where: { id: sub.equipmentId },
            data: { bumpedAt: now },
          });
        }

        // Calculate next bump time
        const nextBumpAt = calculateNextBumpTime(sub.frequency, sub.bumpTimes);

        // Update subscription with next bump time
        await prisma.bumpSubscription.update({
          where: { id: sub.id },
          data: {
            nextBumpAt,
          },
        });

        // Create notification
        await prisma.notification.create({
          data: {
            userId: sub.userId,
            type: "AUTO_BUMP",
            title: "자동 끌어올리기 실행",
            message: `${targetName}이(가) 자동으로 끌어올려졌습니다.`,
            link: sub.listingId ? `/listings/${sub.listingId}` : `/equipment/${sub.equipmentId}`,
          },
        });

        bumpedCount++;
        console.log(`Auto-bumped: ${targetName} (next: ${nextBumpAt.toISOString()})`);
      } catch (error) {
        const errorMsg = `Failed to bump subscription ${sub.id}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // Find and expire subscriptions that have passed their expiration date
    const expiredSubscriptions = await prisma.bumpSubscription.findMany({
      where: {
        status: "ACTIVE",
        expiresAt: {
          lte: now,
        },
      },
      select: {
        id: true,
        userId: true,
        listingId: true,
        equipmentId: true,
        listing: {
          select: {
            storeName: true,
            addressRoad: true,
          },
        },
        equipment: {
          select: {
            title: true,
          },
        },
      },
    });

    let expiredCount = 0;
    if (expiredSubscriptions.length > 0) {
      await prisma.bumpSubscription.updateMany({
        where: {
          id: {
            in: expiredSubscriptions.map((s) => s.id),
          },
        },
        data: {
          status: "EXPIRED",
        },
      });

      // Create expiration notifications
      const expirationNotifications = expiredSubscriptions.map((sub) => {
        const targetName = sub.listing?.storeName || sub.listing?.addressRoad || sub.equipment?.title || "매물";
        return {
          userId: sub.userId,
          type: "BUMP_SUBSCRIPTION_EXPIRED",
          title: "자동 끌어올리기 구독 만료",
          message: `${targetName}의 자동 끌어올리기 구독이 만료되었습니다. 갱신하려면 클릭하세요.`,
          link: sub.listingId ? `/listings/${sub.listingId}` : `/equipment/${sub.equipmentId}`,
        };
      });

      await prisma.notification.createMany({
        data: expirationNotifications,
      });

      expiredCount = expiredSubscriptions.length;
      console.log(`Expired ${expiredCount} bump subscriptions`);
    }

    return NextResponse.json({
      success: true,
      bumpedCount,
      expiredCount,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Auto-bump cron job error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
