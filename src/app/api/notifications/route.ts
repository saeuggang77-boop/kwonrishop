import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sp = req.nextUrl.searchParams;
    const unreadOnly = sp.get("unread") === "true";
    const cursor = sp.get("cursor");
    const limit = Math.min(Number(sp.get("limit") ?? "20"), 50);

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = notifications.length > limit;
    const results = hasMore ? notifications.slice(0, limit) : notifications;

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    });

    return Response.json({
      data: results,
      meta: {
        hasMore,
        cursor: hasMore ? results[results.length - 1].id : undefined,
        unreadCount,
      },
    });
  } catch (error) {
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// Mark all as read
export async function PATCH() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return Response.json({ data: { success: true } });
  } catch (error) {
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
