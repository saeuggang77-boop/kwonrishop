import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorToResponse } from "@/lib/utils/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return Response.json(
        { error: { message: "인증이 필요합니다." } },
        { status: 401 }
      );
    }

    const inquiry = await prisma.expertInquiry.findUnique({
      where: { id },
      include: {
        expert: {
          select: {
            id: true,
            name: true,
            category: true,
            title: true,
            company: true,
            profileImage: true,
            phone: true,
            email: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
        review: true,
      },
    });

    if (!inquiry) {
      return Response.json(
        { error: { message: "상담 내역을 찾을 수 없습니다." } },
        { status: 404 }
      );
    }

    // Only allow the user who created the inquiry to view it
    if (inquiry.userId !== session.user.id) {
      return Response.json(
        { error: { message: "접근 권한이 없습니다." } },
        { status: 403 }
      );
    }

    return Response.json({ data: inquiry });
  } catch (error) {
    return errorToResponse(error);
  }
}
