import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateOrigin } from "@/lib/csrf";
import { rateLimitRequest } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const rateLimitError = await rateLimitRequest(request, 10, 60000);
  if (rateLimitError) return rateLimitError;

  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { userId: true, status: true, expiresAt: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "매물을 찾을 수 없습니다" }, { status: 404 });
    }

    if (listing.userId !== session.user.id) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    // Only ACTIVE or EXPIRED listings can be extended
    if (listing.status !== "ACTIVE" && listing.status !== "EXPIRED") {
      return NextResponse.json(
        { error: "활성 또는 만료된 매물만 연장할 수 있습니다." },
        { status: 400 }
      );
    }

    // Prevent extending if expiry is still more than 7 days away
    if (listing.status === "ACTIVE" && listing.expiresAt) {
      const daysUntilExpiry = (new Date(listing.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysUntilExpiry > 7) {
        return NextResponse.json(
          { error: `만료 7일 전부터 연장할 수 있습니다. (남은 일수: ${Math.ceil(daysUntilExpiry)}일)` },
          { status: 400 }
        );
      }
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
