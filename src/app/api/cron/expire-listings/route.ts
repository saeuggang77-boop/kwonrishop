import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyListingExpiring } from "@/lib/kakao-alimtalk";
import { sendPushToUser } from "@/lib/push";
import { verifyBearerToken } from "@/lib/cron-auth";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret with timing-safe comparison
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json({ error: "Cron not configured" }, { status: 500 });
    }

    if (!verifyBearerToken(authHeader, cronSecret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find listings that should be expired
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const expiredListings = await prisma.listing.findMany({
      where: {
        status: "ACTIVE",
        createdAt: {
          lt: thirtyDaysAgo,
        },
        OR: [
          { expiresAt: null },
          { expiresAt: { lt: new Date() } },
        ],
      },
      select: {
        id: true,
        userId: true,
        storeName: true,
        addressRoad: true,
        user: {
          select: {
            phone: true,
          },
        },
      },
    });

    // Update listings to EXPIRED
    if (expiredListings.length > 0) {
      await prisma.listing.updateMany({
        where: {
          id: {
            in: expiredListings.map((l: any) => l.id),
          },
        },
        data: {
          status: "EXPIRED",
        },
      });

      // Create notifications for owners
      const notifications = expiredListings.map((listing: any) => ({
        userId: listing.userId,
        type: "LISTING_EXPIRED",
        title: "매물이 만료되었습니다",
        message: `${listing.storeName || listing.addressRoad || "매물"}이(가) 만료되었습니다. 연장하려면 클릭하세요.`,
        link: `/listings/${listing.id}`,
      }));

      await prisma.notification.createMany({
        data: notifications,
      });

      // 매물 소유자에게 만료 SMS & 푸시 전송 (비차단)
      expiredListings.forEach((listing: any) => {
        const storeName = listing.storeName || listing.addressRoad || "매물";

        // SMS (non-blocking)
        if (listing.user.phone) {
          notifyListingExpiring(listing.user.phone, storeName, 0).catch(() => {});
        }

        // 웹 푸시 (non-blocking)
        sendPushToUser(
          listing.userId,
          "매물이 만료되었습니다",
          `${storeName}이(가) 만료되었습니다. 연장하려면 클릭하세요.`,
          `/listings/${listing.id}`
        ).catch(() => {});
      });

      console.log(`Expired ${expiredListings.length} listings`);
    }

    // Equipment expiration
    const expiredEquipments = await prisma.equipment.findMany({
      where: {
        status: "ACTIVE",
        expiresAt: {
          lt: new Date(),
          not: null,
        },
      },
      select: {
        id: true,
        userId: true,
        title: true,
        user: {
          select: {
            phone: true,
          },
        },
      },
    });

    if (expiredEquipments.length > 0) {
      await prisma.equipment.updateMany({
        where: {
          id: {
            in: expiredEquipments.map((e: any) => e.id),
          },
        },
        data: {
          status: "EXPIRED",
        },
      });

      const equipmentNotifications = expiredEquipments.map((equip: any) => ({
        userId: equip.userId,
        type: "LISTING_EXPIRED",
        title: "집기 매물이 만료되었습니다",
        message: `${equip.title || "집기 매물"}이(가) 만료되었습니다. 연장하려면 클릭하세요.`,
        link: `/equipment/${equip.id}`,
      }));

      await prisma.notification.createMany({
        data: equipmentNotifications,
      });

      // 집기 소유자에게 만료 SMS & 푸시 전송 (비차단)
      expiredEquipments.forEach((equip: any) => {
        const equipTitle = equip.title || "집기 매물";

        // SMS (non-blocking)
        if (equip.user.phone) {
          notifyListingExpiring(equip.user.phone, equipTitle, 0).catch(() => {});
        }

        // 웹 푸시 (non-blocking)
        sendPushToUser(
          equip.userId,
          "집기 매물이 만료되었습니다",
          `${equipTitle}이(가) 만료되었습니다. 연장하려면 클릭하세요.`,
          `/equipment/${equip.id}`
        ).catch(() => {});
      });

      console.log(`Expired ${expiredEquipments.length} equipment items`);
    }

    // --- 매물 만료 3일 전 사전 알림 ---
    const now = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    // 30일 기준: 27일 전에 생성된 매물 = 3일 후 만료
    const twentySevenDaysAgo = new Date();
    twentySevenDaysAgo.setDate(twentySevenDaysAgo.getDate() - 27);

    const expiringListings = await prisma.listing.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          // expiresAt이 있는 경우: 3일 이내 만료
          { expiresAt: { gt: now, lte: threeDaysLater } },
          // expiresAt 없는 경우: 생성 후 27~30일 (만료 3일 전)
          { expiresAt: null, createdAt: { lte: twentySevenDaysAgo, gt: thirtyDaysAgo } },
        ],
      },
      select: {
        id: true,
        userId: true,
        storeName: true,
        addressRoad: true,
        expiresAt: true,
        createdAt: true,
        user: { select: { phone: true } },
      },
    });

    let listingExpiringAlertCount = 0;
    for (const listing of expiringListings) {
      const alreadyNotified = await prisma.notification.findFirst({
        where: { userId: listing.userId, type: "LISTING_EXPIRING", link: `/listings/${listing.id}` },
      });
      if (alreadyNotified) continue;

      const expiresDate = listing.expiresAt || new Date(listing.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
      const daysLeft = Math.ceil((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const storeName = listing.storeName || listing.addressRoad || "매물";

      await prisma.notification.create({
        data: {
          userId: listing.userId,
          type: "LISTING_EXPIRING",
          title: `매물 만료 ${daysLeft}일 전`,
          message: `${storeName}이(가) ${daysLeft}일 후 만료됩니다. 연장하려면 클릭하세요.`,
          link: `/listings/${listing.id}`,
        },
      });

      if (listing.user.phone) {
        notifyListingExpiring(listing.user.phone, storeName, daysLeft).catch(() => {});
      }

      // 웹 푸시 (non-blocking)
      sendPushToUser(
        listing.userId,
        `매물 만료 ${daysLeft}일 전`,
        `${storeName}이(가) ${daysLeft}일 후 만료됩니다. 연장하려면 클릭하세요.`,
        `/listings/${listing.id}`
      ).catch(() => {});

      listingExpiringAlertCount++;
    }

    if (listingExpiringAlertCount > 0) {
      console.log(`Sent ${listingExpiringAlertCount} pre-expiry alerts for listings`);
    }

    return NextResponse.json({
      success: true,
      expiredCount: expiredListings.length,
      expiredEquipmentCount: expiredEquipments.length,
      listingExpiringAlertCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
