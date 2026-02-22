import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis/client";

/**
 * 홈페이지 매물 카드 필드 — 렌더에 필요한 것만 select
 */
const CARD_SELECT = {
  id: true,
  title: true,
  businessCategory: true,
  storeType: true,
  price: true,
  monthlyRent: true,
  managementFee: true,
  premiumFee: true,
  monthlyRevenue: true,
  monthlyProfit: true,
  areaPyeong: true,
  floor: true,
  city: true,
  district: true,
  neighborhood: true,
  latitude: true,
  longitude: true,
  safetyGrade: true,
  isPremium: true,
  isRecommended: true,
  premiumRank: true,
  hasDiagnosisBadge: true,
  goodwillPremium: true,
  facilityPremium: true,
  floorPremium: true,
  viewCount: true,
  listingExposureOrder: true,
  images: {
    where: { isPrimary: true },
    take: 1,
    select: { url: true, thumbnailUrl: true },
  },
  seller: {
    select: { name: true, image: true, isTrustedSeller: true },
  },
} as const;

type CardListing = Awaited<
  ReturnType<typeof prisma.listing.findMany<{ select: typeof CARD_SELECT }>>
>[number];

/** 큐 타입별 필터 조건 + exposureOrder 필드명 매핑 */
type QueueType = "premium" | "recommend" | "listing" | "jumpUp";

const QUEUE_CONFIG: Record<
  QueueType,
  {
    where: Record<string, unknown>;
    orderField: "premiumExposureOrder" | "recommendExposureOrder" | "listingExposureOrder" | "jumpUpExposureOrder";
  }
> = {
  premium: {
    where: { isPremium: true, premiumRank: { gte: 3 } },
    orderField: "premiumExposureOrder",
  },
  recommend: {
    where: { isRecommended: true },
    orderField: "recommendExposureOrder",
  },
  listing: {
    where: {},
    orderField: "listingExposureOrder",
  },
  jumpUp: {
    where: { isJumpUp: true },
    orderField: "jumpUpExposureOrder",
  },
};

/**
 * 큐 기반 균등 순환 노출 배치 조회
 *
 * 1. exposureOrder ASC 순으로 count개 조회
 * 2. 쿨다운 미활성 시: 노출된 매물의 exposureOrder를 MAX+1부터 재할당 (큐 뒤로 이동)
 * 3. 쿨다운 활성 시: 조회만 수행 (순환 없음)
 */
export async function getExposureBatch(
  queueType: QueueType,
  count: number,
  sessionId: string,
): Promise<{ listings: CardListing[]; rotated: boolean }> {
  const config = QUEUE_CONFIG[queueType];

  // 1. exposureOrder ASC 순으로 count개 조회
  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE", ...config.where },
    select: CARD_SELECT,
    orderBy: { [config.orderField]: "asc" },
    take: count,
  });

  if (listings.length === 0) {
    return { listings: [], rotated: false };
  }

  // 2. Redis 쿨다운 체크
  const cooldownKey = `rotation:${queueType}:${sessionId}`;
  let shouldRotate = false;

  try {
    const redis = getRedis();
    const result = await Promise.race([
      redis.set(cooldownKey, "1", "EX", 300, "NX"),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Redis timeout")), 2000),
      ),
    ]);
    // "OK" = 새로 생성됨 (쿨다운 없었음) → 순환 수행
    // null = 이미 존재 (쿨다운 활성) → 순환 안 함
    shouldRotate = result === "OK";
  } catch {
    // Redis 장애 시 항상 순환 (공정성 우선)
    shouldRotate = true;
  }

  // 3. 순환: 노출된 매물을 큐 뒤로 이동 (fire-and-forget — 응답 지연 방지)
  if (shouldRotate) {
    void (async () => {
      try {
        const maxResult = await prisma.listing.aggregate({
          where: { status: "ACTIVE", ...config.where },
          _max: { [config.orderField]: true },
        });
        const maxOrder =
          (maxResult._max as Record<string, number | null>)[config.orderField] ?? 0;

        await prisma.$transaction(
          listings.map((listing, idx) =>
            prisma.listing.update({
              where: { id: listing.id },
              data: { [config.orderField]: maxOrder + idx + 1 },
            }),
          ),
        );
      } catch {
        // 순환 실패해도 CRON이 정리
      }
    })();
  }

  return { listings, rotated: shouldRotate };
}

/**
 * 새 광고 매물 활성화 시 exposureOrder 할당 — 큐 맨 뒤 배치
 */
export async function assignExposureOrder(
  queueType: QueueType,
): Promise<number> {
  const config = QUEUE_CONFIG[queueType];
  const maxResult = await prisma.listing.aggregate({
    where: { status: "ACTIVE", ...config.where },
    _max: { [config.orderField]: true },
  });
  return (
    ((maxResult._max as Record<string, number | null>)[config.orderField] ?? 0) + 1
  );
}
