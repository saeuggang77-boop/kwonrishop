import { prisma } from "@/lib/prisma";
import HomeClient from "./HomeClient";

export const revalidate = 30;

export default async function HomePage() {
  const now = new Date();

  const [rawListings, franchiseCount, partnerCount, equipmentCount] = await Promise.all([
    prisma.listing.findMany({
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
    }),
    prisma.franchiseBrand.count({ where: { tier: { in: ["GOLD", "SILVER", "BRONZE"] } } }),
    prisma.partnerService.count({ where: { status: "ACTIVE" } }),
    prisma.equipment.count({ where: { status: "ACTIVE" } }),
  ]);

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

  return (
    <HomeClient
      initialListings={listings}
      franchiseCount={franchiseCount}
      partnerCount={partnerCount}
      equipmentCount={equipmentCount}
    />
  );
}
