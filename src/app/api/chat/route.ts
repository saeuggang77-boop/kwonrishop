import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateOrigin } from "@/lib/csrf";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

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
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rl = rateLimit(ip, 10, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다." }, { status: 429 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { listingId, equipmentId } = await req.json();

  if (!listingId && !equipmentId) {
    return NextResponse.json({ error: "매물 또는 집기 ID가 필요합니다." }, { status: 400 });
  }

  let sellerId: string;
  let roomFilter: Record<string, unknown>;
  let roomData: Record<string, unknown>;

  if (equipmentId) {
    // 집기 채팅
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      select: { id: true, userId: true },
    });

    if (!equipment) {
      return NextResponse.json({ error: "집기를 찾을 수 없습니다." }, { status: 404 });
    }

    if (equipment.userId === session.user.id) {
      return NextResponse.json({ error: "본인의 집기에는 채팅할 수 없습니다." }, { status: 400 });
    }

    sellerId = equipment.userId;
    roomFilter = { equipmentId };
    roomData = { equipmentId };
  } else {
    // 매물 채팅
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

    sellerId = listing.userId;
    roomFilter = { listingId };
    roomData = { listingId };
  }

  // 이미 존재하는 채팅방 확인
  const existingRoom = await prisma.chatRoom.findFirst({
    where: {
      ...roomFilter,
      AND: [
        { participants: { some: { userId: session.user.id } } },
        { participants: { some: { userId: sellerId } } },
      ],
    },
  });

  if (existingRoom) {
    return NextResponse.json({ chatRoomId: existingRoom.id });
  }

  // 새 채팅방 생성
  const chatRoom = await prisma.chatRoom.create({
    data: {
      ...roomData,
      participants: {
        create: [
          { userId: session.user.id },
          { userId: sellerId },
        ],
      },
    },
  });

  return NextResponse.json({ chatRoomId: chatRoom.id });
}
