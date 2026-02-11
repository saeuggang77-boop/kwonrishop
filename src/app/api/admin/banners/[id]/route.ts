import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorToResponse } from "@/lib/utils/errors";

const bannerUpdateSchema = z.object({
  title: z.string().min(1).max(100),
  imageUrl: z.string().url(),
  linkUrl: z.string().url().nullable(),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
}).partial();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return Response.json(
        { error: { message: "관리자 권한이 필요합니다." } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = bannerUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: { message: "유효하지 않은 입력입니다.", details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const banner = await prisma.banner.update({
      where: { id },
      data: parsed.data,
    });

    return Response.json({ data: banner });
  } catch (error) {
    return errorToResponse(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return Response.json(
        { error: { message: "관리자 권한이 필요합니다." } },
        { status: 403 }
      );
    }

    await prisma.banner.delete({
      where: { id },
    });

    return Response.json({ data: { success: true } });
  } catch (error) {
    return errorToResponse(error);
  }
}
