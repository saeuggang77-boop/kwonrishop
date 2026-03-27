import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeInput } from "@/lib/sanitize";
import { validateOrigin } from "@/lib/csrf";
import { pusher } from "@/lib/pusher";
import { sendEmail } from "@/lib/email";
import { newChatMessageEmail } from "@/lib/email-templates";
import { notifyNewChat } from "@/lib/kakao-alimtalk";

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

  // 읽음 처리
  await prisma.chatParticipant.update({
    where: { id: participant.id },
    data: { lastReadAt: new Date() },
  });

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
  const ip = getClientIp(req);
  const limiter = rateLimit(ip, 30, 60000);
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

  // 이메일 & 알림톡: 상대방에게 전송 (비차단, fire and forget)
  (async () => {
    try {
      const chatRoom = await prisma.chatRoom.findUnique({
        where: { id: roomId },
        select: {
          listing: { select: { storeName: true, addressRoad: true } },
          participants: {
            where: { userId: { not: session.user.id } },
            select: { user: { select: { email: true, name: true, phone: true } } },
          },
        },
      });

      if (chatRoom && chatRoom.participants.length > 0) {
        const otherUser = chatRoom.participants[0].user;
        const listingName = chatRoom.listing.storeName || chatRoom.listing.addressRoad || "매물";

        // 이메일 알림
        if (otherUser.email) {
          const { subject, html } = newChatMessageEmail(
            otherUser.name || "회원",
            session.user.name || "사용자",
            listingName
          );
          await sendEmail(otherUser.email, subject, html);
        }

        // 알림톡 (non-blocking)
        if (otherUser.phone) {
          notifyNewChat(
            otherUser.phone,
            session.user.name || "사용자",
            listingName
          ).catch(() => {});
        }
      }
    } catch (error) {
      console.error("[Notification] Failed to send chat notification:", error);
    }
  })();

  return NextResponse.json(message);
}
