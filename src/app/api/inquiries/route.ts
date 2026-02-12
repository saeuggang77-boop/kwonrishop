import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { createInquirySchema } from "@/lib/validators/inquiry";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const type = sp.get("type") ?? "received"; // "sent" | "received"
  const cursor = sp.get("cursor");
  const limit = Math.min(Number(sp.get("limit") ?? "20"), 50);

  const whereClause =
    type === "sent"
      ? { senderId: session.user.id }
      : { receiverId: session.user.id };

  const inquiries = await prisma.inquiry.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = inquiries.length > limit;
  const results = hasMore ? inquiries.slice(0, limit) : inquiries;

  // Get listing and user info
  const listingIds = [...new Set(results.map((i) => i.listingId))];
  const userIds = [
    ...new Set(results.map((i) => (type === "sent" ? i.receiverId : i.senderId))),
  ];

  const [listings, users] = await Promise.all([
    prisma.listing.findMany({
      where: { id: { in: listingIds } },
      select: { id: true, title: true },
    }),
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    }),
  ]);

  const listingMap = new Map(listings.map((l) => [l.id, l]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  return Response.json({
    data: results.map((i) => ({
      ...i,
      listing: listingMap.get(i.listingId) ?? null,
      otherUser:
        userMap.get(type === "sent" ? i.receiverId : i.senderId) ?? null,
    })),
    meta: {
      hasMore,
      cursor: hasMore ? results[results.length - 1].id : undefined,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const limited = await checkRateLimit(`inquiry:${session.user.id}`, 10, 60);
      if (limited) return limited;
    } catch {}

    const body = await req.json();
    const parsed = createInquirySchema.parse(body);

    const listing = await prisma.listing.findUnique({
      where: { id: parsed.listingId },
      select: { sellerId: true, title: true },
    });

    if (!listing) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.sellerId === session.user.id) {
      return Response.json({ error: "Cannot inquire on your own listing" }, { status: 400 });
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        listingId: parsed.listingId,
        senderId: session.user.id,
        receiverId: listing.sellerId,
        message: parsed.message.trim(),
        senderName: parsed.senderName ?? null,
        senderPhone: parsed.senderPhone ?? null,
        status: "PENDING",
      },
    });

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: listing.sellerId,
        title: "새 문의가 도착했습니다",
        message: `"${listing.title}"에 대한 새 문의가 있습니다.`,
        link: `/my/inquiries`,
        sourceType: "inquiry",
        sourceId: inquiry.id,
      },
    });

    // Send SMS notification (fire-and-forget)
    fetch(`${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/notifications/sms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: listing.sellerId,
        message: `"${listing.title}"에 대한 새 문의가 도착했습니다.`,
      }),
    }).catch(() => {
      // fire-and-forget: ignore errors
    });

    return Response.json({ data: inquiry }, { status: 201 });
  } catch (error) {
    console.error("POST /api/inquiries error:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
