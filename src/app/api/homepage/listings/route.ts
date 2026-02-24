import { prisma } from "@/lib/prisma";
import { errorToResponse } from "@/lib/utils/errors";
import { HOMEPAGE_SLOTS } from "@/lib/utils/constants";
import { getExposureBatch } from "@/lib/utils/rotation-queue";
import { createHash } from "crypto";

/**
 * 메모리 캐시 (30초 TTL)
 */
let cachedResponse: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 30_000; // 30초

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
    // 캐시 확인
    if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL) {
      return new Response(JSON.stringify(cachedResponse.data), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      });
    }

    const sessionId = getSessionId(req);

    // 큐 기반 순환 조회 + 신뢰 지표 통계
    const [premiumBatch, recommendBatch, listingsCount, soldCount, expertsCount, inquiriesCount] = await Promise.all([
      getExposureBatch("premium", HOMEPAGE_SLOTS.PREMIUM, sessionId),
      getExposureBatch("recommend", HOMEPAGE_SLOTS.RECOMMEND, sessionId),
      prisma.listing.count({ where: { status: "ACTIVE" } }),
      prisma.listing.count({ where: { status: "SOLD" } }),
      prisma.expert.count({ where: { isActive: true } }),
      prisma.inquiry.count(),
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

    const responseData = {
      premiumTop: premiumBatch.listings.map(serialize),
      recommended: recommendBatch.listings.map(serialize),
      stats: { listingsCount, soldCount, expertsCount, inquiriesCount },
    };

    // 응답 캐싱
    cachedResponse = { data: responseData, timestamp: Date.now() };

    return new Response(JSON.stringify(responseData), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    return errorToResponse(error);
  }
}
