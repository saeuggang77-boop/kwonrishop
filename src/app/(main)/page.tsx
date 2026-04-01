import { prisma } from "@/lib/prisma";
import HomeClient from "./HomeClient";

export const revalidate = 30;

export default async function HomePage() {
  const now = new Date();

  const [rawListings, rawBrands, rawPartners, rawEquipment] = await Promise.all([
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
    prisma.franchiseBrand.findMany({
      where: { tier: { in: ["GOLD", "SILVER", "BRONZE"] } },
      take: 10,
      orderBy: [{ tier: "desc" }, { totalStores: "desc" }],
      select: {
        id: true,
        brandName: true,
        industry: true,
        totalStores: true,
        logo: true,
        tier: true,
        description: true,
        avgRevenue: true,
        franchiseFee: true,
      },
    }),
    prisma.partnerService.findMany({
      where: { status: "ACTIVE", tier: { not: "FREE" } },
      orderBy: [{ tier: "desc" }, { viewCount: "desc" }],
      select: {
        id: true,
        companyName: true,
        serviceType: true,
        description: true,
        serviceArea: true,
        tier: true,
        images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
      },
    }),
    prisma.equipment.findMany({
      where: {
        status: "ACTIVE",
        adPurchases: { some: { status: "PAID", expiresAt: { gt: now } } },
      },
      orderBy: [{ tier: "desc" }, { createdAt: "desc" }],
      take: 8,
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        negotiable: true,
        category: true,
        condition: true,
        tier: true,
        viewCount: true,
        favoriteCount: true,
        createdAt: true,
        images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
      },
    }),
  ]);

  // featuredTier 계산 + 직렬화
  const tierOrder: Record<string, number> = { VIP: 0, PREMIUM: 1, BASIC: 2, FREE: 3 };
  const listings = rawListings.map((l) => {
    const purchase = (l as any).adPurchases?.[0];
    const productFeatures = purchase?.product?.features as Record<string, any> | undefined;
    const productName = purchase?.product?.name || "";
    const badge = productFeatures?.badge as string | undefined;
    let tier = "FREE";
    if (purchase) {
      if (badge) {
        const badgeMap: Record<string, string> = { "VIP": "VIP", "프리미엄": "PREMIUM", "베이직": "BASIC" };
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
  }).sort((a, b) => (tierOrder[a.featuredTier] ?? 3) - (tierOrder[b.featuredTier] ?? 3));

  const brands = rawBrands.map((b) => ({
    id: b.id,
    brandName: b.brandName,
    industry: b.industry,
    totalStores: b.totalStores,
    logo: b.logo,
    tier: b.tier,
    description: b.description,
    avgRevenue: b.avgRevenue ? Number(b.avgRevenue) : null,
    franchiseFee: b.franchiseFee ? Number(b.franchiseFee) : null,
  }));

  const partners = rawPartners.map((p) => ({
    id: p.id,
    companyName: p.companyName,
    serviceType: p.serviceType,
    serviceArea: p.serviceArea,
    tier: p.tier,
    images: p.images,
    description: p.description,
  }));

  const equipmentItems = rawEquipment.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    price: e.price,
    negotiable: e.negotiable,
    category: e.category,
    condition: e.condition,
    tier: e.tier,
    images: e.images,
    viewCount: e.viewCount,
    favoriteCount: e.favoriteCount,
    createdAt: e.createdAt.toISOString(),
  }));

  return (
    <HomeClient
      initialListings={listings}
      initialFranchiseBrands={brands}
      initialPartnerServices={partners}
      initialEquipment={equipmentItems}
    />
  );
}
