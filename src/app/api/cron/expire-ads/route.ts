import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { adExpiredEmail } from "@/lib/email-templates";

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
      const targetName = ad.listing?.storeName || ad.listing?.addressRoad || ad.partnerService?.companyName || "서비스";
      return {
        userId: ad.userId,
        type: "AD_EXPIRED",
        title: "광고 상품이 만료되었습니다",
        message: `${ad.product.name} 상품이 만료되었습니다. ${targetName}의 광고 혜택이 종료됩니다.`,
        link: ad.listingId ? `/mypage/listings` : `/mypage/partner`,
      };
    });

    await prisma.notification.createMany({
      data: notifications,
    });

    // Send expiration emails (non-blocking)
    expiredAds.forEach((ad: any) => {
      if (ad.user.email) {
        (async () => {
          try {
            const targetName = ad.listing?.storeName || ad.listing?.addressRoad || ad.partnerService?.companyName || "서비스";
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

    return NextResponse.json({
      success: true,
      expiredCount: expiredAds.length,
      partnerTierDowngradeCount,
      franchiseTierDowngradeCount: franchiseTierDowngrade.count,
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
