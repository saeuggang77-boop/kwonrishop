import { prisma } from "@/lib/prisma";
import HomeClient from "./HomeClient";

export const revalidate = 30;

export default async function HomePage() {
  const now = new Date();

  const rawListings = await prisma.listing.findMany({
    where: { status: "ACTIVE" },
    orderBy: [
      { bumpedAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
    ],
    take: 20,
    select: {
      id: true,
      addressRoad: true,
      addressJibun: true,
      deposit: true,
      monthlyRent: true,
      premium: true,
      premiumNone: true,
      premiumNegotiable: true,
      brandType: true,
      storeName: true,
      areaPyeong: true,
      currentFloor: true,
      themes: true,
      viewCount: true,
      favoriteCount: true,
      createdAt: true,
      category: { select: { name: true, icon: true } },
      subCategory: { select: { name: true } },
      images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
      adPurchases: {
        where: { status: "PAID", expiresAt: { gt: now } },
        include: { product: { select: { id: true, name: true, features: true } } },
        take: 1,
        orderBy: { createdAt: "desc" as const },
      },
      _count: { select: { documents: true } },
    },
  });

  const tierOrder: Record<string, number> = { VIP: 0, PREMIUM: 1, BASIC: 2, FREE: 3 };
  const listings = rawListings
    .map((l) => {
      const purchase = (l as any).adPurchases?.[0];
      const productFeatures = purchase?.product?.features as Record<string, any> | undefined;
      const productName = purchase?.product?.name || "";
      const badge = productFeatures?.badge as string | undefined;
      let tier = "FREE";
      if (purchase) {
        if (badge) {
          const badgeMap: Record<string, string> = { VIP: "VIP", 프리미엄: "PREMIUM", 베이직: "BASIC" };
          tier = badgeMap[badge] || "BASIC";
        } else if (productName) {
          if (productName.includes("VIP")) tier = "VIP";
          else if (productName.includes("프리미엄")) tier = "PREMIUM";
          else tier = "BASIC";
        } else {
          tier = "BASIC";
        }
      }
      return {
        id: l.id,
        addressRoad: l.addressRoad,
        addressJibun: l.addressJibun,
        deposit: l.deposit,
        monthlyRent: l.monthlyRent,
        premium: l.premium,
        premiumNone: l.premiumNone,
        premiumNegotiable: l.premiumNegotiable,
        brandType: l.brandType,
        storeName: l.storeName,
        areaPyeong: l.areaPyeong ? Number(l.areaPyeong) : null,
        currentFloor: l.currentFloor,
        themes: l.themes,
        viewCount: l.viewCount,
        favoriteCount: l.favoriteCount,
        createdAt: l.createdAt.toISOString(),
        category: l.category,
        subCategory: l.subCategory,
        images: l.images,
        featuredTier: tier,
        _count: l._count,
      };
    })
    .sort((a, b) => (tierOrder[a.featuredTier] ?? 3) - (tierOrder[b.featuredTier] ?? 3));

  // 추천 프랜차이즈 (avgRevenue 기준 상위, 이미지 X 정보 사용)
  const franchises = await prisma.franchiseBrand.findMany({
    where: { avgRevenue: { not: null, gt: 0 } },
    orderBy: { avgRevenue: "desc" },
    take: 4,
    select: {
      id: true,
      brandName: true,
      industry: true,
      avgRevenue: true,
      franchiseFee: true,
      totalStores: true,
    },
  });

  // 공지사항 + 이용가이드 (각 5개)
  const [notices, guides] = await Promise.all([
    prisma.post.findMany({
      where: { tag: "공지" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.post.findMany({
      where: { tag: "이용가이드" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, createdAt: true },
    }),
  ]);

  return (
    <HomeClient
      initialListings={listings}
      franchises={franchises.map((f) => ({
        id: f.id,
        brandName: f.brandName,
        industry: f.industry,
        avgRevenue: f.avgRevenue,
        franchiseFee: f.franchiseFee,
        totalStores: f.totalStores,
      }))}
      notices={notices.map((n) => ({ id: n.id, title: n.title, createdAt: n.createdAt.toISOString() }))}
      guides={guides.map((g) => ({ id: g.id, title: g.title, createdAt: g.createdAt.toISOString() }))}
    />
  );
}
