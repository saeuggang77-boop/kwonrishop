import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { likeCount: true },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "매물을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({
        liked: false,
        likeCount: listing.likeCount,
      });
    }

    const existingLike = await prisma.listingLike.findUnique({
      where: {
        listingId_userId: {
          listingId: id,
          userId: session.user.id,
        },
      },
    });

    return NextResponse.json({
      liked: !!existingLike,
      likeCount: listing.likeCount,
    });
  } catch {
    return NextResponse.json(
      { error: "매물을 찾을 수 없습니다" },
      { status: 404 }
    );
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "인증이 필요합니다" },
      { status: 401 }
    );
  }

  const { id } = await params;

  // Check listing exists
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!listing) {
    return NextResponse.json(
      { error: "매물을 찾을 수 없습니다" },
      { status: 404 }
    );
  }

  // Check if already liked
  const existingLike = await prisma.listingLike.findUnique({
    where: {
      listingId_userId: {
        listingId: id,
        userId: session.user.id,
      },
    },
  });

  if (existingLike) {
    // Unlike: delete the like and decrement likeCount
    await prisma.$transaction([
      prisma.listingLike.delete({
        where: { id: existingLike.id },
      }),
      prisma.listing.update({
        where: { id },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);

    const updated = await prisma.listing.findUnique({
      where: { id },
      select: { likeCount: true },
    });

    return NextResponse.json({
      success: true,
      liked: false,
      likeCount: updated!.likeCount,
    });
  } else {
    // Like: create the like and increment likeCount
    await prisma.$transaction([
      prisma.listingLike.create({
        data: {
          listingId: id,
          userId: session.user.id,
        },
      }),
      prisma.listing.update({
        where: { id },
        data: { likeCount: { increment: 1 } },
      }),
    ]);

    const updated = await prisma.listing.findUnique({
      where: { id },
      select: { likeCount: true },
    });

    return NextResponse.json({
      success: true,
      liked: true,
      likeCount: updated!.likeCount,
    });
  }
}
