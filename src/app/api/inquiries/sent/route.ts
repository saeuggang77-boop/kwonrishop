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
    const cursor = sp.get("cursor");
    const limit = 20;

    const inquiries = await prisma.inquiry.findMany({
      where: { senderId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        receiver: {
          select: { id: true, name: true, email: true },
        },
        listing: {
          select: {
            id: true,
            title: true,
            images: { take: 1, orderBy: { sortOrder: "asc" } },
          },
        },
      },
    });

    const hasMore = inquiries.length > limit;
    const results = hasMore ? inquiries.slice(0, limit) : inquiries;

    return Response.json({
      data: results,
      meta: {
        hasMore,
        cursor: hasMore ? results[results.length - 1].id : undefined,
      },
    });
  } catch (error) {
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
