import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const [user, verification, listing, favoriteCount, chatCount, partnerService, franchiseBrand, equipmentCount, equipmentFavoriteCount, activeListingAd] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          name: true,
          email: true,
          image: true,
          role: true,
          phone: true,
          createdAt: true,
          password: true,
        },
      }),
      prisma.businessVerification.findUnique({
        where: { userId: session.user.id },
        select: { verified: true, businessName: true },
      }),
      prisma.listing.findUnique({
        where: { userId: session.user.id },
        select: {
          id: true,
          status: true,
          storeName: true,
          viewCount: true,
          favoriteCount: true,
        },
      }),
      prisma.favorite.count({ where: { userId: session.user.id } }),
      prisma.chatParticipant.count({ where: { userId: session.user.id } }),
      prisma.partnerService.findUnique({
        where: { userId: session.user.id },
        select: {
          id: true,
          status: true,
          companyName: true,
          serviceType: true,
          viewCount: true,
          tier: true,
          description: true,
          serviceArea: true,
          contactPhone: true,
          contactEmail: true,
          website: true,
          addressRoad: true,
          addressJibun: true,
          addressDetail: true,
          latitude: true,
          longitude: true,
        },
      }),
      prisma.franchiseBrand.findUnique({
        where: { managerId: session.user.id },
        select: {
          id: true,
          brandName: true,
          tier: true,
        },
      }),
      prisma.equipment.count({
        where: { userId: session.user.id, status: { not: "DELETED" } },
      }),
      prisma.equipmentFavorite.count({
        where: { userId: session.user.id },
      }),
      prisma.adPurchase.findFirst({
        where: {
          userId: session.user.id,
          status: "PAID",
          product: { categoryScope: "LISTING" },
          expiresAt: { gt: new Date() },
        },
        orderBy: { expiresAt: "desc" },
        select: {
          id: true,
          expiresAt: true,
          activatedAt: true,
          viewCountAtAdStart: true,
          product: { select: { name: true } },
        },
      }),
    ]);

  // Calculate unread chat messages
  const participants = await prisma.chatParticipant.findMany({
    where: { userId: session.user.id },
    select: { chatRoomId: true, lastReadAt: true },
  });

  let unreadChatCount = 0;
  for (const p of participants) {
    const count = await prisma.message.count({
      where: {
        chatRoomId: p.chatRoomId,
        senderId: { not: session.user.id },
        ...(p.lastReadAt ? { createdAt: { gt: p.lastReadAt } } : {}),
      },
    });
    unreadChatCount += count;
  }

  const safeUser = user ? {
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    phone: user.phone,
    createdAt: user.createdAt,
    hasPassword: !!user.password,
  } : null;

  return NextResponse.json({
    user: safeUser,
    verification,
    listing: listing?.status !== "DELETED" ? listing : null,
    favoriteCount,
    chatCount,
    unreadChatCount,
    partnerService: partnerService?.status !== "DELETED" ? partnerService : null,
    franchiseBrand,
    equipmentCount,
    equipmentFavoriteCount,
    activeListingAd: activeListingAd && activeListingAd.expiresAt ? {
      name: activeListingAd.product.name,
      expiresAt: activeListingAd.expiresAt.toISOString(),
      daysLeft: Math.ceil((activeListingAd.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      viewCountAtAdStart: activeListingAd.viewCountAtAdStart,
    } : null,
  });
}
