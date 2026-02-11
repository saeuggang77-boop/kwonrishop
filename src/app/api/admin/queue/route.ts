import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorToResponse } from "@/lib/utils/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const cursor = req.nextUrl.searchParams.get("cursor");
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "20"), 100);

    // Show only severity >= HIGH or users with 2+ violations
    const violations = await prisma.fraudViolation.findMany({
      where: {
        status: "PENDING",
        OR: [
          { severity: { in: ["HIGH", "CRITICAL"] } },
          {
            user: { violationCount: { gte: 2 } },
          },
        ],
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            status: true,
            price: true,
            city: true,
            district: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            violationCount: true,
          },
        },
        rule: {
          select: {
            name: true,
            ruleType: true,
            description: true,
          },
        },
      },
      orderBy: [
        { severity: "desc" },
        { createdAt: "asc" },
      ],
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: limit + 1,
    });

    const hasMore = violations.length > limit;
    const data = hasMore ? violations.slice(0, -1) : violations;

    return Response.json({
      data: data.map((v) => ({
        ...v,
        listing: {
          ...v.listing,
          price: v.listing.price.toString(),
        },
      })),
      meta: {
        cursor: data[data.length - 1]?.id,
        hasMore,
      },
    });
  } catch (error) {
    return errorToResponse(error);
  }
}
