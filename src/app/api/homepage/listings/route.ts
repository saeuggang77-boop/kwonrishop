import { prisma } from "@/lib/prisma";
import { errorToResponse } from "@/lib/utils/errors";
import { HOMEPAGE_SLOTS, HOMEPAGE_ROTATION_KEY } from "@/lib/utils/constants";
import { getRotatedGroup } from "@/lib/utils/homepage-rotation";

export async function GET() {
  try {
    // 활성 프리미엄 매물 전체 조회 (VIP + 추천)
    const allPremium = await prisma.listing.findMany({
      where: {
        status: "ACTIVE",
        isPremium: true,
        premiumRank: { gte: 2 },
      },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        seller: { select: { name: true, image: true, isTrustedSeller: true } },
      },
      orderBy: [
        { premiumRank: "desc" },
        { createdAt: "desc" },
      ],
    });

    // VIP(rank=3)와 추천(rank=2) 분리
    const vipListings = allPremium.filter((l) => l.premiumRank === 3);
    const recListings = allPremium.filter((l) => l.premiumRank === 2);

    // 채움용 최신 일반 매물 조회 (프리미엄 제외)
    const premiumIds = new Set(allPremium.map((l) => l.id));
    const fillCount = Math.max(HOMEPAGE_SLOTS.PREMIUM, HOMEPAGE_SLOTS.RECOMMEND);
    const latestFill = await prisma.listing.findMany({
      where: {
        status: "ACTIVE",
        id: { notIn: [...premiumIds] },
      },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        seller: { select: { name: true, image: true, isTrustedSeller: true } },
      },
      orderBy: { createdAt: "desc" },
      take: fillCount,
    });

    // 프리미엄 순환 적용
    const premiumGroup = await getRotatedGroup(
      vipListings,
      HOMEPAGE_SLOTS.PREMIUM,
      HOMEPAGE_ROTATION_KEY.PREMIUM,
      latestFill,
    );

    // 추천 순환 적용 (프리미엄에 이미 사용된 채움 매물 제외)
    const usedIds = new Set(premiumGroup.map((l) => l.id));
    const recFill = latestFill.filter((l) => !usedIds.has(l.id));

    const recommendGroup = await getRotatedGroup(
      recListings,
      HOMEPAGE_SLOTS.RECOMMEND,
      HOMEPAGE_ROTATION_KEY.RECOMMEND,
      recFill,
    );

    // BigInt → string 직렬화
    const serialize = (l: typeof allPremium[number]) => ({
      id: l.id,
      title: l.title,
      businessCategory: l.businessCategory,
      storeType: l.storeType,
      price: l.price.toString(),
      monthlyRent: l.monthlyRent?.toString() ?? null,
      premiumFee: l.premiumFee?.toString() ?? null,
      monthlyRevenue: l.monthlyRevenue?.toString() ?? null,
      monthlyProfit: l.monthlyProfit?.toString() ?? null,
      areaPyeong: l.areaPyeong,
      floor: l.floor,
      city: l.city,
      district: l.district,
      images: l.images.map((img) => ({
        url: img.url,
        thumbnailUrl: img.thumbnailUrl,
      })),
      safetyGrade: l.safetyGrade,
      isPremium: l.isPremium,
      premiumRank: l.premiumRank,
      hasDiagnosisBadge: l.hasDiagnosisBadge,
      seller: l.seller,
    });

    return Response.json({
      premium: premiumGroup.map(serialize),
      recommend: recommendGroup.map(serialize),
    });
  } catch (error) {
    return errorToResponse(error);
  }
}
