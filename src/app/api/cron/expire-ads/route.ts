import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyPaymentExpiring } from "@/lib/kakao-alimtalk";
import { sendPushToUser } from "@/lib/push";
import { verifyBearerToken } from "@/lib/cron-auth";
import { rateLimitRequest } from "@/lib/rate-limit";

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

    const rateLimitError = await rateLimitRequest(request, 2, 60000);
    if (rateLimitError) return rateLimitError;

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
            name: true,
            role: true,
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
        equipmentTierDowngradeCount: 0,
        listingTierDowngradeCount: 0,
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
    // partnerServiceId가 있는 경우와 없는 경우 모두 처리
    const partnerAds = expiredAds.filter((ad: any) => {
      // PARTNER 광고: partnerServiceId가 있거나 userId로 PARTNER 서비스를 찾을 수 있는 경우
      return ad.partnerServiceId || ad.user?.role === "PARTNER";
    });

    let partnerTierDowngradeCount = 0;
    if (partnerAds.length > 0) {
      // partnerServiceId 수집 (직접 있는 것 + userId로 찾아야 하는 것)
      const directPartnerServiceIds = partnerAds
        .filter((ad: any) => ad.partnerServiceId)
        .map((ad: any) => ad.partnerServiceId);

      const userIdsNeedingLookup = partnerAds
        .filter((ad: any) => !ad.partnerServiceId)
        .map((ad: any) => ad.userId);

      let indirectPartnerServiceIds: string[] = [];
      if (userIdsNeedingLookup.length > 0) {
        const indirectServices = await prisma.partnerService.findMany({
          where: {
            userId: { in: userIdsNeedingLookup },
            status: "ACTIVE",
          },
          select: { id: true },
        });
        indirectPartnerServiceIds = indirectServices.map((s) => s.id);
      }

      const allPartnerServiceIds = [...directPartnerServiceIds, ...indirectPartnerServiceIds];

      if (allPartnerServiceIds.length > 0) {
        // 다운그레이드 전 파트너 서비스 정보 조회 (알림용)
        const partnerServices = await prisma.partnerService.findMany({
          where: {
            id: { in: allPartnerServiceIds },
            tierExpiresAt: { lt: now },
          },
          select: {
            id: true,
            userId: true,
            companyName: true,
            tier: true,
            user: { select: { phone: true, name: true } },
          },
        });

        const result = await prisma.partnerService.updateMany({
          where: {
            id: {
              in: allPartnerServiceIds,
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

        // 파트너 서비스 다운그레이드 알림 생성
        if (partnerServices.length > 0) {
          const partnerNotifications = partnerServices.map((ps) => ({
            userId: ps.userId,
            type: "PARTNER_TIER_DOWNGRADE",
            title: "파트너 구독이 만료되었습니다",
            message: `${ps.companyName}의 ${ps.tier} 등급 혜택이 종료되어 FREE 등급으로 전환되었습니다. 구독을 연장하시려면 결제 페이지를 확인해주세요.`,
            link: `/mypage`,
          }));

          await prisma.notification.createMany({
            data: partnerNotifications,
          });

          // 웹 푸시 및 SMS 발송 (non-blocking)
          partnerServices.forEach((ps) => {
            sendPushToUser(
              ps.userId,
              "파트너 구독이 만료되었습니다",
              `${ps.companyName}의 ${ps.tier} 등급 혜택이 종료되었습니다.`,
              `/mypage`
            ).catch(() => {});

            if (ps.user.phone) {
              notifyPaymentExpiring(ps.user.phone, `"${ps.companyName}" ${ps.tier} 파트너 구독`, 0).catch(() => {});
            }
          });
        }
      }
    }

    // Downgrade franchise brand tiers
    // 다운그레이드 전 프랜차이즈 정보 조회 (알림용)
    const franchiseBrands = await prisma.franchiseBrand.findMany({
      where: {
        tierExpiresAt: { lt: now },
        tier: { not: "FREE" },
        managerId: { not: null },
      },
      select: {
        id: true,
        managerId: true,
        brandName: true,
        tier: true,
        manager: { select: { phone: true, name: true } },
      },
    });

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

    // 프랜차이즈 다운그레이드 알림 생성
    if (franchiseBrands.length > 0) {
      const franchiseNotifications = franchiseBrands
        .filter((fb) => fb.managerId)
        .map((fb) => ({
          userId: fb.managerId!,
          type: "FRANCHISE_TIER_DOWNGRADE",
          title: "프랜차이즈 구독이 만료되었습니다",
          message: `${fb.brandName}의 ${fb.tier} 등급 혜택이 종료되어 FREE 등급으로 전환되었습니다. 구독을 연장하시려면 결제 페이지를 확인해주세요.`,
          link: `/mypage`,
        }));

      if (franchiseNotifications.length > 0) {
        await prisma.notification.createMany({
          data: franchiseNotifications,
        });

        franchiseBrands.filter((fb) => fb.managerId).forEach((fb) => {
          sendPushToUser(
            fb.managerId!,
            "프랜차이즈 구독이 만료되었습니다",
            `${fb.brandName}의 ${fb.tier} 등급 혜택이 종료되었습니다.`,
            `/mypage`
          ).catch(() => {});

          if (fb.manager?.phone) {
            notifyPaymentExpiring(fb.manager.phone, `"${fb.brandName}" ${fb.tier} 프랜차이즈 구독`, 0).catch(() => {});
          }
        });
      }
    }

    // Downgrade equipment tiers
    // 다운그레이드 전 집기 정보 조회 (알림용)
    const equipmentItems = await prisma.equipment.findMany({
      where: {
        tierExpiresAt: { lt: now },
        tier: { not: "FREE" },
      },
      select: {
        id: true,
        userId: true,
        title: true,
        tier: true,
        user: { select: { phone: true, name: true } },
      },
    });

    const equipmentTierDowngrade = await prisma.equipment.updateMany({
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

    // 집기 다운그레이드 알림 생성
    if (equipmentItems.length > 0) {
      const equipmentNotifications = equipmentItems.map((eq) => ({
        userId: eq.userId,
        type: "EQUIPMENT_TIER_DOWNGRADE",
        title: "집기장터 광고가 만료되었습니다",
        message: `${eq.title}의 ${eq.tier} 등급 혜택이 종료되어 FREE 등급으로 전환되었습니다. 광고를 연장하시려면 결제 페이지를 확인해주세요.`,
        link: `/equipment/${eq.id}`,
      }));

      await prisma.notification.createMany({
        data: equipmentNotifications,
      });

      equipmentItems.forEach((eq) => {
        sendPushToUser(
          eq.userId,
          "집기장터 광고가 만료되었습니다",
          `${eq.title}의 ${eq.tier} 등급 혜택이 종료되었습니다.`,
          `/equipment/${eq.id}`
        ).catch(() => {});

        if (eq.user?.phone) {
          notifyPaymentExpiring(eq.user.phone, `"${eq.title}" ${eq.tier} 집기장터 광고`, 0).catch(() => {});
        }
      });
    }

    // Downgrade listing tiers
    const listingItems = await prisma.listing.findMany({
      where: {
        tierExpiresAt: { lt: now },
        tier: { not: "FREE" },
      },
      select: {
        id: true,
        userId: true,
        storeName: true,
        addressRoad: true,
        tier: true,
        user: { select: { phone: true, name: true } },
      },
    });

    const listingTierDowngrade = await prisma.listing.updateMany({
      where: {
        tierExpiresAt: { lt: now },
        tier: { not: "FREE" },
      },
      data: {
        tier: "FREE",
        tierExpiresAt: null,
      },
    });

    // 매물 다운그레이드 알림 생성
    if (listingItems.length > 0) {
      const listingNotifications = listingItems.map((l) => ({
        userId: l.userId,
        type: "LISTING_TIER_DOWNGRADE",
        title: "매물 광고가 만료되었습니다",
        message: `${l.storeName || l.addressRoad || "매물"}의 ${l.tier} 등급 혜택이 종료되어 FREE 등급으로 전환되었습니다. 광고를 연장하시려면 결제 페이지를 확인해주세요.`,
        link: `/mypage`,
      }));

      await prisma.notification.createMany({
        data: listingNotifications,
      });

      listingItems.forEach((l) => {
        sendPushToUser(
          l.userId,
          "매물 광고가 만료되었습니다",
          `${l.storeName || l.addressRoad || "매물"}의 ${l.tier} 등급 혜택이 종료되었습니다.`,
          `/mypage`
        ).catch(() => {});

        if (l.user?.phone) {
          notifyPaymentExpiring(l.user.phone, `"${l.storeName || l.addressRoad || "매물"}" ${l.tier} 매물 광고`, 0).catch(() => {});
        }
      });
    }

    // Create notifications for each expired ad
    const notifications = expiredAds.map((ad: any) => {
      const targetName = ad.listing?.storeName || ad.listing?.addressRoad || ad.partnerService?.companyName || ad.equipment?.title || "서비스";
      return {
        userId: ad.userId,
        type: "AD_EXPIRED",
        title: "광고 상품이 만료되었습니다",
        message: `${ad.product.name} 상품이 만료되었습니다. ${targetName}의 광고 혜택이 종료됩니다.`,
        link: ad.listingId ? `/mypage` : ad.equipmentId ? `/equipment/${ad.equipmentId}` : `/mypage`,
      };
    });

    await prisma.notification.createMany({
      data: notifications,
    });

    // 웹 푸시: 광고 만료 알림 (non-blocking)
    expiredAds.forEach((ad: any) => {
      const targetName = ad.listing?.storeName || ad.listing?.addressRoad || ad.partnerService?.companyName || ad.equipment?.title || "서비스";
      const pushLink = ad.listingId ? `/mypage` : ad.equipmentId ? `/equipment/${ad.equipmentId}` : `/mypage`;
      sendPushToUser(
        ad.userId,
        "광고 상품이 만료되었습니다",
        `${ad.product.name} 상품이 만료되었습니다. ${targetName}의 광고 혜택이 종료됩니다.`,
        pushLink
      ).catch(() => {});
    });

    console.log(`Expired ${expiredAds.length} ad purchases`);
    console.log(`Downgraded ${partnerTierDowngradeCount} partner services to FREE tier`);
    console.log(`Downgraded ${franchiseTierDowngrade.count} franchise brands to FREE tier`);
    console.log(`Downgraded ${equipmentTierDowngrade.count} equipment to FREE tier`);
    console.log(`Downgraded ${listingTierDowngrade.count} listings to FREE tier`);

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
        const smsTargetName = ad.listing?.storeName || ad.listing?.addressRoad || ad.partnerService?.companyName || ad.equipment?.title || "";
        const smsProductLabel = smsTargetName ? `"${smsTargetName}" ${ad.product.name}` : ad.product.name;
        notifyPaymentExpiring(ad.user.phone, smsProductLabel, daysLeft).catch(() => {});
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
      equipmentTierDowngradeCount: equipmentTierDowngrade.count,
      listingTierDowngradeCount: listingTierDowngrade.count,
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
