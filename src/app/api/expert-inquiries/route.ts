import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorToResponse } from "@/lib/utils/errors";

const createInquirySchema = z.object({
  expertId: z.string().min(1, "전문가 ID가 필요합니다."),
  category: z.string().min(1, "상담 카테고리가 필요합니다."),
  subject: z.string().min(1, "제목을 입력해주세요.").max(100, "제목은 100자 이내로 입력해주세요."),
  message: z.string().min(1, "내용을 입력해주세요.").max(2000, "내용은 2000자 이내로 입력해주세요."),
  listingId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json(
        { error: { message: "인증이 필요합니다." } },
        { status: 401 }
      );
    }

    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, Number(sp.get("page") ?? "1"));
    const limit = Math.min(Math.max(1, Number(sp.get("limit") ?? "20")), 50);
    const skip = (page - 1) * limit;
    const status = sp.get("status");

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };
    if (status) where.status = status;

    const [inquiries, total] = await Promise.all([
      prisma.expertInquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          expert: {
            select: {
              id: true,
              name: true,
              category: true,
              title: true,
              profileImage: true,
            },
          },
          review: {
            select: { id: true, rating: true },
          },
        },
      }),
      prisma.expertInquiry.count({ where }),
    ]);

    return Response.json({
      data: inquiries,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return errorToResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json(
        { error: { message: "인증이 필요합니다." } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = createInquirySchema.parse(body);

    // Verify expert exists and is active
    const expert = await prisma.expert.findUnique({
      where: { id: parsed.expertId, isActive: true },
      select: { id: true },
    });

    if (!expert) {
      return Response.json(
        { error: { message: "전문가를 찾을 수 없습니다." } },
        { status: 404 }
      );
    }

    // Verify listing exists if provided
    if (parsed.listingId) {
      const listing = await prisma.listing.findUnique({
        where: { id: parsed.listingId },
        select: { id: true },
      });
      if (!listing) {
        return Response.json(
          { error: { message: "매물을 찾을 수 없습니다." } },
          { status: 404 }
        );
      }
    }

    // Create inquiry and increment consultCount in a transaction
    const inquiry = await prisma.$transaction(async (tx) => {
      const created = await tx.expertInquiry.create({
        data: {
          expertId: parsed.expertId,
          userId: session.user.id,
          category: parsed.category,
          subject: parsed.subject,
          message: parsed.message,
          listingId: parsed.listingId ?? null,
        },
        include: {
          expert: {
            select: {
              id: true,
              name: true,
              category: true,
              title: true,
            },
          },
        },
      });

      await tx.expert.update({
        where: { id: parsed.expertId },
        data: { consultCount: { increment: 1 } },
      });

      return created;
    });

    return Response.json({ data: inquiry }, { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}
