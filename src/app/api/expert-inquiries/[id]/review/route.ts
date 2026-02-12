import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorToResponse } from "@/lib/utils/errors";

const createReviewSchema = z.object({
  rating: z.number().int().min(1, "평점은 1 이상이어야 합니다.").max(5, "평점은 5 이하이어야 합니다."),
  content: z.string().min(1, "리뷰 내용을 입력해주세요.").max(500, "리뷰는 500자 이내로 입력해주세요."),
});

export async function POST(
  req: NextRequest,
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

    const body = await req.json();
    const parsed = createReviewSchema.parse(body);

    // Fetch the inquiry
    const inquiry = await prisma.expertInquiry.findUnique({
      where: { id },
      include: { review: true },
    });

    if (!inquiry) {
      return Response.json(
        { error: { message: "상담 내역을 찾을 수 없습니다." } },
        { status: 404 }
      );
    }

    // Must be own inquiry
    if (inquiry.userId !== session.user.id) {
      return Response.json(
        { error: { message: "본인의 상담에만 리뷰를 작성할 수 있습니다." } },
        { status: 403 }
      );
    }

    // Status must be COMPLETED
    if (inquiry.status !== "COMPLETED") {
      return Response.json(
        { error: { message: "완료된 상담에만 리뷰를 작성할 수 있습니다." } },
        { status: 400 }
      );
    }

    // Must not already have a review
    if (inquiry.review) {
      return Response.json(
        { error: { message: "이미 리뷰가 작성되었습니다." } },
        { status: 409 }
      );
    }

    // Create review and update expert rating in a transaction
    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.expertReview.create({
        data: {
          expertId: inquiry.expertId,
          userId: session.user.id,
          inquiryId: id,
          rating: parsed.rating,
          content: parsed.content,
        },
      });

      // Recalculate expert's average rating
      const expert = await tx.expert.findUnique({
        where: { id: inquiry.expertId },
        select: { rating: true, reviewCount: true },
      });

      if (expert) {
        const newReviewCount = expert.reviewCount + 1;
        const newRating =
          (expert.rating * expert.reviewCount + parsed.rating) / newReviewCount;

        await tx.expert.update({
          where: { id: inquiry.expertId },
          data: {
            rating: Math.round(newRating * 10) / 10, // Round to 1 decimal
            reviewCount: newReviewCount,
          },
        });
      }

      return created;
    });

    return Response.json({ data: review }, { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}
