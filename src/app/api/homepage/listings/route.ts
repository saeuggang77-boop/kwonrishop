import { prisma } from "@/lib/prisma";
import { errorToResponse } from "@/lib/utils/errors";
import { HOMEPAGE_SLOTS } from "@/lib/utils/constants";
import { getExposureBatch } from "@/lib/utils/rotation-queue";
import { createHash } from "crypto";

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
  isRecommended: true,
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
 * 세션 ID 추출 — 쿠키 또는 IP 해시 폴백
 */
function getSessionId(req: Request): string {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const tokenMatch = cookieHeader.match(
    /(?:__Secure-)?next-auth\.session-token=([^;]+)/,
  );
  if (tokenMatch?.[1]) {
    return createHash("sha256").update(tokenMatch[1]).digest("hex").slice(0, 16);
  }

  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0].trim() || "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export async function GET(req: Request) {
  try {
    const sessionId = getSessionId(req);

    // 큐 기반 순환 조회
    const [premiumBatch, recommendBatch] = await Promise.all([
      getExposureBatch("premium", HOMEPAGE_SLOTS.PREMIUM, sessionId),
      getExposureBatch("recommend", HOMEPAGE_SLOTS.RECOMMEND, sessionId),
    ]);

    // BigInt → string 직렬화
    const serialize = (l: (typeof premiumBatch.listings)[number]) => ({
      ...l,
      price: l.price.toString(),
      monthlyRent: l.monthlyRent?.toString() ?? null,
      managementFee: l.managementFee?.toString() ?? null,
      premiumFee: l.premiumFee?.toString() ?? null,
      monthlyRevenue: l.monthlyRevenue?.toString() ?? null,
      monthlyProfit: l.monthlyProfit?.toString() ?? null,
    });

    return new Response(
      JSON.stringify({
        premiumTop: premiumBatch.listings.map(serialize),
        recommended: recommendBatch.listings.map(serialize),
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
