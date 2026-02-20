import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorToResponse } from "@/lib/utils/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, Number(sp.get("page") ?? "1"));
    const limit = Math.min(Math.max(1, Number(sp.get("limit") ?? "10")), 50);
    const skip = (page - 1) * limit;

    // Verify expert exists
    const expert = await prisma.expert.findUnique({
      where: { id, isActive: true },
      select: { id: true },
    });

    if (!expert) {
      return Response.json(
        { error: { message: "전문가를 찾을 수 없습니다." } },
        { status: 404 }
      );
    }

    const where = { expertId: id };

    const [reviews, total] = await Promise.all([
      prisma.expertReview.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      }),
      prisma.expertReview.count({ where }),
    ]);

    return new Response(
      JSON.stringify({
        reviews: reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          content: r.content,
          reviewerName: r.user.name ?? "익명",
          createdAt: r.createdAt.toISOString(),
        })),
        total,
        page,
        hasMore: skip + reviews.length < total,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (error) {
    return errorToResponse(error);
  }
}
