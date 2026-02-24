import { cookies } from "next/headers";
import { createHash } from "crypto";
import { getExposureBatch } from "@/lib/utils/rotation-queue";
import { HOMEPAGE_SLOTS } from "@/lib/utils/constants";
import type { ListingCardData } from "@/components/listings/listing-card";
import HomeClient from "./_home-client";

/**
 * 세션 ID 추출 -- 쿠키 기반, 없으면 랜덤 해시 폴백
 */
async function getSessionId(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get("__Secure-next-auth.session-token")?.value ??
      cookieStore.get("next-auth.session-token")?.value;
    if (token) {
      return createHash("sha256").update(token).digest("hex").slice(0, 16);
    }
  } catch {
    // cookies() 호출 실패 시 폴백
  }
  // 세션 없으면 랜덤 — 순환 쿨다운이 세션별로 동작하므로 문제없음
  return createHash("sha256")
    .update(Date.now().toString() + Math.random().toString())
    .digest("hex")
    .slice(0, 16);
}

/**
 * Prisma BigInt → string 직렬화 + ListingCardData 변환
 */
function toCardData(
  l: Record<string, unknown>,
): ListingCardData {
  return {
    id: String(l.id),
    title: String(l.title ?? ""),
    businessCategory: String(l.businessCategory ?? ""),
    storeType: String(l.storeType ?? ""),
    price: String(l.price ?? "0"),
    monthlyRent: l.monthlyRent != null ? String(l.monthlyRent) : null,
    premiumFee: l.premiumFee != null ? String(l.premiumFee) : null,
    monthlyRevenue: l.monthlyRevenue != null ? String(l.monthlyRevenue) : null,
    monthlyProfit: l.monthlyProfit != null ? String(l.monthlyProfit) : null,
    city: String(l.city ?? ""),
    district: String(l.district ?? ""),
    images: (l.images as { url: string; thumbnailUrl: string | null }[]) ?? [],
    safetyGrade: l.safetyGrade != null ? String(l.safetyGrade) : null,
    isPremium: Boolean(l.isPremium),
    premiumRank: Number(l.premiumRank ?? 0),
    hasDiagnosisBadge: Boolean(l.hasDiagnosisBadge),
    areaPyeong: l.areaPyeong != null ? Number(l.areaPyeong) : null,
    floor: l.floor != null ? String(l.floor) : null,
    seller: l.seller as ListingCardData["seller"],
    neighborhood: l.neighborhood != null ? String(l.neighborhood) : null,
    managementFee: l.managementFee != null ? String(l.managementFee) : null,
    viewCount: l.viewCount != null ? Number(l.viewCount) : undefined,
    goodwillPremium: l.goodwillPremium != null ? Number(l.goodwillPremium) : null,
    facilityPremium: l.facilityPremium != null ? Number(l.facilityPremium) : null,
    floorPremium: l.floorPremium != null ? Number(l.floorPremium) : null,
  };
}

/* ═══════════════════════════════════════════════════════════ */
export default async function HomePage() {
  const sessionId = await getSessionId();

  let premiumListings: ListingCardData[] = [];
  let recommendedListings: ListingCardData[] = [];

  try {
    const [premiumBatch, recommendBatch] = await Promise.all([
      getExposureBatch("premium", HOMEPAGE_SLOTS.PREMIUM, sessionId),
      getExposureBatch("recommend", HOMEPAGE_SLOTS.RECOMMEND, sessionId),
    ]);

    premiumListings = premiumBatch.listings.map((l) =>
      toCardData(l as unknown as Record<string, unknown>),
    );
    recommendedListings = recommendBatch.listings.map((l) =>
      toCardData(l as unknown as Record<string, unknown>),
    );
  } catch {
    // DB 장애 시 빈 목록으로 렌더링 — 클라이언트 인터랙션은 정상 동작
  }

  return (
    <HomeClient
      premiumListings={premiumListings}
      recommendedListings={recommendedListings}
    />
  );
}
