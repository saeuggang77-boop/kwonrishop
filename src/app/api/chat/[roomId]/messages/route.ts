import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimitRequest } from "@/lib/rate-limit";
import { sanitizeInput } from "@/lib/sanitize";
import { validateOrigin } from "@/lib/csrf";
import { pusher } from "@/lib/pusher";
import { sendPushToUser } from "@/lib/push";

// 메시지 조회
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { roomId } = await params;

  // 참여자인지 확인
  const participant = await prisma.chatParticipant.findUnique({
    where: {
      chatRoomId_userId: { chatRoomId: roomId, userId: session.user.id },
    },
  });

  if (!participant) {
    return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = 50;

  const messages = await prisma.message.findMany({
    where: { chatRoomId: roomId },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      content: true,
      createdAt: true,
      senderId: true,
      sender: { select: { name: true, image: true } },
    },
  });

  // 읽음 처리 제거 - /read 엔드포인트에서만 명시적으로 수행

  return NextResponse.json({
    messages: messages.reverse(),
    hasMore: messages.length === limit,
  });
}

// 메시지 전송
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  // Rate limiting: 30 messages per minute
  const limiter = rateLimitRequest(req, 30, 60000);
  if (!limiter.success) {
    return NextResponse.json(
      { error: "메시지 전송이 너무 빠릅니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  // CSRF protection
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { roomId } = await params;

  const participant = await prisma.chatParticipant.findUnique({
    where: {
      chatRoomId_userId: { chatRoomId: roomId, userId: session.user.id },
    },
  });

  if (!participant) {
    return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
  }

  const { content } = await req.json();
  const cleanContent = sanitizeInput(content);

  if (!cleanContent?.trim()) {
    return NextResponse.json({ error: "메시지를 입력해주세요." }, { status: 400 });
  }

  // content 길이 제한 (최대 1000자)
  if (cleanContent.length > 1000) {
    return NextResponse.json(
      { error: "메시지는 1000자를 초과할 수 없습니다." },
      { status: 400 }
    );
  }

  const message = await prisma.message.create({
    data: {
      chatRoomId: roomId,
      senderId: session.user.id,
      content: cleanContent.trim(),
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      senderId: true,
      sender: { select: { name: true, image: true } },
    },
  });

  // 채팅방 updatedAt 갱신
  await prisma.chatRoom.update({
    where: { id: roomId },
    data: { updatedAt: new Date() },
  });

  // Pusher: 실시간 메시지 전송
  if (process.env.PUSHER_APP_ID) {
    try {
      await pusher.trigger(`chat-${roomId}`, "new-message", {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        sender: { name: session.user.name, image: session.user.image },
        createdAt: message.createdAt,
      });
    } catch (error) {
      console.error("[Pusher] Failed to send message:", error);
    }
  }

  // 웹 푸시: 상대방에게 전송 (비차단, fire and forget)
  (async () => {
    try {
      const chatRoom = await prisma.chatRoom.findUnique({
        where: { id: roomId },
        select: {
          participants: {
            where: { userId: { not: session.user.id } },
            select: { userId: true },
          },
        },
      });

      if (chatRoom && chatRoom.participants.length > 0) {
        sendPushToUser(
          chatRoom.participants[0].userId,
          `${session.user.name || "사용자"}님의 새 메시지`,
          cleanContent.trim().slice(0, 100),
          `/chat/${roomId}`
        ).catch(() => {});
      }
    } catch (error) {
      console.error("[Notification] Failed to send chat notification:", error);
    }
  })();

  return NextResponse.json(message);
}
