import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorToResponse } from "@/lib/utils/errors";

const bannerCreateSchema = z.object({
  title: z.string().min(1).max(100),
  imageUrl: z.string().url(),
  linkUrl: z.string().url().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

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
    const parsed = bannerCreateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: { message: "유효하지 않은 입력입니다.", details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const { title, imageUrl, linkUrl, sortOrder } = parsed.data;

    const banner = await prisma.banner.create({
      data: {
        title,
        imageUrl,
        linkUrl: linkUrl ?? null,
        sortOrder: sortOrder ?? 0,
        isActive: true,
      },
    });

    return Response.json({ data: banner }, { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}
