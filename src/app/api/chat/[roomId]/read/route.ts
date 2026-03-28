import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { roomId } = await params;

  await prisma.chatParticipant.updateMany({
    where: {
      chatRoomId: roomId,
      userId: session.user.id,
    },
    data: {
      lastReadAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
