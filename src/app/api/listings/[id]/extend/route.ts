import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { userId: true, status: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "매물을 찾을 수 없습니다" }, { status: 404 });
    }

    if (listing.userId !== session.user.id) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    // Extend by 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: {
        expiresAt,
        status: listing.status === "EXPIRED" ? "ACTIVE" : listing.status,
      },
      include: {
        category: true,
        subCategory: true,
        images: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            phone: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            favorites: true,
            chatRooms: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      listing: updatedListing,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Extend listing error:", error);
    return NextResponse.json(
      { error: "매물 연장에 실패했습니다" },
      { status: 500 }
    );
  }
}
