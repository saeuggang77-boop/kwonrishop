import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorToResponse } from "@/lib/utils/errors";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return Response.json(
        { error: { message: "관리자 권한이 필요합니다." } },
        { status: 403 }
      );
    }

    const banners = await prisma.banner.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return Response.json({ data: banners });
  } catch (error) {
    return errorToResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return Response.json(
        { error: { message: "관리자 권한이 필요합니다." } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, imageUrl, linkUrl, sortOrder, isActive } = body;

    if (!title || !imageUrl) {
      return Response.json(
        { error: { message: "필수 필드가 누락되었습니다." } },
        { status: 400 }
      );
    }

    const banner = await prisma.banner.create({
      data: {
        title,
        imageUrl,
        linkUrl: linkUrl ?? null,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
    });

    return Response.json({ data: banner }, { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}
