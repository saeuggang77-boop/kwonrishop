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

    return Response.json({ data: expert });
  } catch (error) {
    return errorToResponse(error);
  }
}
