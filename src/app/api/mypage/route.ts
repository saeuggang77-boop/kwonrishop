import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const [user, verification, listing, favoriteCount, chatCount, partnerService, franchiseBrand, equipmentCount, equipmentFavoriteCount] =
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
    ]);

  return NextResponse.json({
    user,
    verification,
    listing: listing?.status !== "DELETED" ? listing : null,
    favoriteCount,
    chatCount,
    partnerService: partnerService?.status !== "DELETED" ? partnerService : null,
    franchiseBrand,
    equipmentCount,
    equipmentFavoriteCount,
  });
}
