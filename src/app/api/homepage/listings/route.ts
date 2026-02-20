import { prisma } from "@/lib/prisma";
import { errorToResponse } from "@/lib/utils/errors";
import { HOMEPAGE_SLOTS } from "@/lib/utils/constants";

/**
 * 홈페이지 매물 필드 — 카드 렌더에 필요한 것만 select
 */
const CARD_SELECT = {
  id: true,
  title: true,
  businessCategory: true,
  storeType: true,
  price: true,
  monthlyRent: true,
  premiumFee: true,
  monthlyRevenue: true,
  monthlyProfit: true,
  areaPyeong: true,
  floor: true,
  city: true,
  district: true,
  safetyGrade: true,
  isPremium: true,
  premiumRank: true,
  hasDiagnosisBadge: true,
  images: {
    where: { isPrimary: true },
    take: 1,
    select: { url: true, thumbnailUrl: true },
  },
  seller: {
    select: { name: true, image: true, isTrustedSeller: true },
  },
} as const;

/**
 * 시간 기반 균등 순환 — Redis 불필요.
 * 5분 간격으로 그룹이 변경되어 광고 공정성 유지.
 */
function pickGroup<T extends { id: string }>(
  items: T[],
  slotCount: number,
  fillItems: T[],
): T[] {
  if (items.length === 0) return fillItems.slice(0, slotCount);

  if (items.length <= slotCount) {
    if (items.length < slotCount) {
      const usedIds = new Set(items.map((i) => i.id));
      const padding = fillItems
        .filter((i) => !usedIds.has(i.id))
        .slice(0, slotCount - items.length);
      return [...items, ...padding];
    }
    return items;
  }

  const totalGroups = Math.ceil(items.length / slotCount);
  const groupIndex = Math.floor(Date.now() / 300_000) % totalGroups; // 5분 간격
  const start = groupIndex * slotCount;
  const group = items.slice(start, start + slotCount);

  if (group.length < slotCount) {
    const usedIds = new Set(group.map((i) => i.id));
    const padding = fillItems
      .filter((i) => !usedIds.has(i.id))
      .slice(0, slotCount - group.length);
    return [...group, ...padding];
  }

  return group;
}

export async function GET() {
  try {
    // 두 쿼리를 병렬 실행 (fill 쿼리가 premium 결과에 의존하지 않도록 변경)
    const [allPremium, latestFill] = await Promise.all([
      prisma.listing.findMany({
        where: {
          status: "ACTIVE",
          isPremium: true,
          premiumRank: { gte: 2 },
        },
        select: CARD_SELECT,
        orderBy: [{ premiumRank: "desc" }, { createdAt: "desc" }],
      }),
      prisma.listing.findMany({
        where: {
          status: "ACTIVE",
          OR: [{ isPremium: false }, { premiumRank: { lt: 2 } }],
        },
        select: CARD_SELECT,
        orderBy: { createdAt: "desc" },
        take: Math.max(HOMEPAGE_SLOTS.PREMIUM, HOMEPAGE_SLOTS.RECOMMEND),
      }),
    ]);

    const vipListings = allPremium.filter((l) => l.premiumRank === 3);
    const recListings = allPremium.filter((l) => l.premiumRank === 2);

    const premiumGroup = pickGroup(
      vipListings,
      HOMEPAGE_SLOTS.PREMIUM,
      latestFill,
    );

    const usedIds = new Set(premiumGroup.map((l) => l.id));
    const recFill = latestFill.filter((l) => !usedIds.has(l.id));

    const recommendGroup = pickGroup(
      recListings,
      HOMEPAGE_SLOTS.RECOMMEND,
      recFill,
    );

    // BigInt → string 직렬화
    const serialize = (l: (typeof allPremium)[number]) => ({
      ...l,
      price: l.price.toString(),
      monthlyRent: l.monthlyRent?.toString() ?? null,
      premiumFee: l.premiumFee?.toString() ?? null,
      monthlyRevenue: l.monthlyRevenue?.toString() ?? null,
      monthlyProfit: l.monthlyProfit?.toString() ?? null,
    });

    return new Response(
      JSON.stringify({
        premium: premiumGroup.map(serialize),
        recommend: recommendGroup.map(serialize),
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (error) {
    return errorToResponse(error);
  }
}
