import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ unreadCount: 0 });
  }

  const participants = await prisma.chatParticipant.findMany({
    where: { userId: session.user.id },
    select: { chatRoomId: true, lastReadAt: true },
  });

  let totalUnread = 0;
  for (const p of participants) {
    const count = await prisma.message.count({
      where: {
        chatRoomId: p.chatRoomId,
        senderId: { not: session.user.id },
        ...(p.lastReadAt ? { createdAt: { gt: p.lastReadAt } } : {}),
      },
    });
    totalUnread += count;
  }

  return NextResponse.json({ unreadCount: totalUnread });
}
