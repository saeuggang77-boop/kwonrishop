import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { errorToResponse } from "@/lib/utils/errors";

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json(
        { error: { message: "인증이 필요합니다." } },
        { status: 401 }
      );
    }

    const premiumListings = await prisma.premiumListing.findMany({
      where: {
        listing: { sellerId: session.user.id },
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            businessCategory: true,
            isPremium: true,
            premiumRank: true,
            viewCount: true,
            inquiryCount: true,
          },
        },
        plan: {
          select: {
            name: true,
            displayName: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({
      data: premiumListings.map((pl) => ({
        ...pl,
        plan: {
          ...pl.plan,
          price: pl.plan.price.toString(),
        },
      })),
    });
  } catch (error) {
    return errorToResponse(error);
  }
}
