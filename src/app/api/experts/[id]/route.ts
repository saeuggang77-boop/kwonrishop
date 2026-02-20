import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorToResponse } from "@/lib/utils/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const expert = await prisma.expert.findUnique({
      where: { id, isActive: true },
      include: {
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    if (!expert) {
      return Response.json(
        { error: { message: "전문가를 찾을 수 없습니다." } },
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({
        data: {
          id: expert.id,
          name: expert.name,
          title: expert.title,
          company: expert.company,
          category: expert.category,
          region: expert.region,
          profileImage: expert.profileImage,
          specialties: expert.specialties as string[],
          description: expert.description,
          rating: expert.rating,
          reviewCount: expert.reviewCount,
          consultationCount: expert.consultCount,
          experienceYears: expert.career,
          isVerified: expert.isVerified,
          reviews: expert.reviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            content: r.content,
            reviewerName: r.user.name ?? "익명",
            createdAt: r.createdAt.toISOString(),
          })),
        },
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    return errorToResponse(error);
  }
}
