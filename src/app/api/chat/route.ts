import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 내 채팅방 목록
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const chatRooms = await prisma.chatRoom.findMany({
    where: {
      participants: { some: { userId: session.user.id } },
    },
    include: {
      listing: {
        select: {
          id: true,
          storeName: true,
          addressRoad: true,
          premium: true,
          premiumNone: true,
          images: { take: 1, select: { url: true } },
        },
      },
      participants: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { content: true, createdAt: true, senderId: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(chatRooms);
}

// 채팅방 생성 (또는 기존 채팅방 반환)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { listingId } = await req.json();
  if (!listingId) {
    return NextResponse.json({ error: "매물 ID가 필요합니다." }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, userId: true },
  });

  if (!listing) {
    return NextResponse.json({ error: "매물을 찾을 수 없습니다." }, { status: 404 });
  }

  if (listing.userId === session.user.id) {
    return NextResponse.json({ error: "본인의 매물에는 채팅할 수 없습니다." }, { status: 400 });
  }

  // 이미 존재하는 채팅방 확인
  const existingRoom = await prisma.chatRoom.findFirst({
    where: {
      listingId,
      AND: [
        { participants: { some: { userId: session.user.id } } },
        { participants: { some: { userId: listing.userId } } },
      ],
    },
  });

  if (existingRoom) {
    return NextResponse.json({ chatRoomId: existingRoom.id });
  }

  // 새 채팅방 생성
  const chatRoom = await prisma.chatRoom.create({
    data: {
      listingId,
      participants: {
        create: [
          { userId: session.user.id },
          { userId: listing.userId },
        ],
      },
    },
  });

  return NextResponse.json({ chatRoomId: chatRoom.id });
}
