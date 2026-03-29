import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { adExpiredEmail } from "@/lib/email-templates";
import { notifyPaymentExpiring } from "@/lib/kakao-alimtalk";
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

    const now = new Date();

    // Find expired ad purchases
    const expiredAds = await prisma.adPurchase.findMany({
      where: {
        status: "PAID",
        expiresAt: {
          lt: now,
          not: null,
        },
      },
      select: {
        id: true,
        userId: true,
        listingId: true,
        partnerServiceId: true,
        equipmentId: true,
        product: {
          select: {
            name: true,
            type: true,
          },
        },
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        listing: {
          select: {
            storeName: true,
            addressRoad: true,
          },
        },
        partnerService: {
          select: {
            companyName: true,
          },
        },
        equipment: {
          select: {
            title: true,
          },
        },
      },
    });

    if (expiredAds.length === 0) {
      return NextResponse.json({
        success: true,
        expiredCount: 0,
        tierDowngradeCount: 0,
        franchiseTierDowngradeCount: 0,
        timestamp: now.toISOString(),
      });
    }

    // Update ad purchases to EXPIRED
    await prisma.adPurchase.updateMany({
      where: {
        id: {
          in: expiredAds.map((ad: any) => ad.id),
        },
      },
      data: {
        status: "EXPIRED",
      },
    });

    // Downgrade partner service tiers
    const partnerServiceIds = expiredAds
      .filter((ad: any) => ad.partnerServiceId)
      .map((ad: any) => ad.partnerServiceId);

    let partnerTierDowngradeCount = 0;
    if (partnerServiceIds.length > 0) {
      const result = await prisma.partnerService.updateMany({
        where: {
          id: {
            in: partnerServiceIds,
          },
          tierExpiresAt: {
            lt: now,
          },
        },
        data: {
          tier: "FREE",
          tierExpiresAt: null,
        },
      });
      partnerTierDowngradeCount = result.count;
    }

    // Downgrade franchise brand tiers
    const franchiseTierDowngrade = await prisma.franchiseBrand.updateMany({
      where: {
        tierExpiresAt: {
          lt: now,
        },
        tier: {
          not: "FREE",
        },
      },
      data: {
        tier: "FREE",
        tierExpiresAt: null,
      },
    });

    // Create notifications for each expired ad
    const notifications = expiredAds.map((ad: any) => {
      const targetName = ad.listing?.storeName || ad.listing?.addressRoad || ad.partnerService?.companyName || ad.equipment?.title || "서비스";
      return {
        userId: ad.userId,
        type: "AD_EXPIRED",
        title: "광고 상품이 만료되었습니다",
        message: `${ad.product.name} 상품이 만료되었습니다. ${targetName}의 광고 혜택이 종료됩니다.`,
        link: ad.listingId ? `/mypage/listings` : ad.equipmentId ? `/equipment/${ad.equipmentId}` : `/mypage/partner`,
      };
    });

    await prisma.notification.createMany({
      data: notifications,
    });

    // 웹 푸시: 광고 만료 알림 (non-blocking)
    expiredAds.forEach((ad: any) => {
      const targetName = ad.listing?.storeName || ad.listing?.addressRoad || ad.partnerService?.companyName || ad.equipment?.title || "서비스";
      const pushLink = ad.listingId ? `/mypage/listings` : ad.equipmentId ? `/equipment/${ad.equipmentId}` : `/mypage/partner`;
      sendPushToUser(
        ad.userId,
        "광고 상품이 만료되었습니다",
        `${ad.product.name} 상품이 만료되었습니다. ${targetName}의 광고 혜택이 종료됩니다.`,
        pushLink
      ).catch(() => {});
    });

    // Send expiration emails (non-blocking)
    expiredAds.forEach((ad: any) => {
      if (ad.user.email) {
        (async () => {
          try {
            const targetName = ad.listing?.storeName || ad.listing?.addressRoad || ad.partnerService?.companyName || ad.equipment?.title || "서비스";
            const { subject, html } = adExpiredEmail(
              ad.user.name || "회원",
              ad.product.name,
              targetName
            );
            await sendEmail(ad.user.email, subject, html);
          } catch (error) {
            console.error("[Email] Failed to send ad expiration email:", error);
          }
        })();
      }
    });

    console.log(`Expired ${expiredAds.length} ad purchases`);
    console.log(`Downgraded ${partnerTierDowngradeCount} partner services to FREE tier`);
    console.log(`Downgraded ${franchiseTierDowngrade.count} franchise brands to FREE tier`);

    // --- 만료 3일 전 사전 알림 ---
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const expiringAds = await prisma.adPurchase.findMany({
      where: {
        status: "PAID",
        expiresAt: {
          gt: now,
          lte: threeDaysLater,
          not: null,
        },
      },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        product: { select: { name: true } },
        user: { select: { name: true, phone: true } },
        listing: { select: { storeName: true, addressRoad: true } },
        partnerService: { select: { companyName: true } },
        equipment: { select: { title: true } },
      },
    });

    // 중복 알림 방지: 이미 AD_EXPIRING 알림을 받은 구매건 제외
    let expiringAlertCount = 0;
    for (const ad of expiringAds) {
      const alreadyNotified = await prisma.notification.findFirst({
        where: {
          userId: ad.userId,
          type: "AD_EXPIRING",
          link: { contains: ad.id },
        },
      });
      if (alreadyNotified) continue;

      const targetName = ad.listing?.storeName || ad.listing?.addressRoad || ad.partnerService?.companyName || ad.equipment?.title || "서비스";
      const daysLeft = Math.ceil((ad.expiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      await prisma.notification.create({
        data: {
          userId: ad.userId,
          type: "AD_EXPIRING",
          title: `광고 만료 ${daysLeft}일 전`,
          message: `${ad.product.name} 상품이 ${daysLeft}일 후 만료됩니다. ${targetName}의 광고를 연장하세요.`,
          link: `/mypage/ads?renew=${ad.id}`,
        },
      });

      if (ad.user.phone) {
        notifyPaymentExpiring(ad.user.phone, ad.product.name, daysLeft).catch(() => {});
      }

      // 웹 푸시 (non-blocking)
      sendPushToUser(
        ad.userId,
        `광고 만료 ${daysLeft}일 전`,
        `${ad.product.name} 상품이 ${daysLeft}일 후 만료됩니다. ${targetName}의 광고를 연장하세요.`,
        `/mypage/ads?renew=${ad.id}`
      ).catch(() => {});

      expiringAlertCount++;
    }

    if (expiringAlertCount > 0) {
      console.log(`Sent ${expiringAlertCount} pre-expiry alerts for ads`);
    }

    return NextResponse.json({
      success: true,
      expiredCount: expiredAds.length,
      partnerTierDowngradeCount,
      franchiseTierDowngradeCount: franchiseTierDowngrade.count,
      expiringAlertCount,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
