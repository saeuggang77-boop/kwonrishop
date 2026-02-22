import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod/v4";
import { errorToResponse } from "@/lib/utils/errors";

const purchaseSchema = z.object({
  listingId: z.string().min(1),
  type: z.enum(["JUMP_UP", "URGENT_TAG", "AUTO_REFRESH"]),
  reason: z.string().max(30).optional(),
});

const SERVICE_CONFIG = {
  JUMP_UP: { price: 10000, durationMs: 24 * 60 * 60 * 1000 },
  URGENT_TAG: { price: 100000, durationMs: 30 * 24 * 60 * 60 * 1000 },
  AUTO_REFRESH: { price: 150000, durationMs: 30 * 24 * 60 * 60 * 1000 },
} as const;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json(
        { error: { message: "인증이 필요합니다." } },
        { status: 401 }
      );
    }
    // 결제 연동 전까지 관리자만 활성화 가능
    if (session.user.role !== "ADMIN") {
      return Response.json(
        { error: { message: "서비스 준비 중입니다. 곧 오픈됩니다." } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = purchaseSchema.parse(body);

    // Verify listing exists and belongs to user
    const listing = await prisma.listing.findUnique({
      where: { id: parsed.listingId },
      select: { id: true, sellerId: true, status: true },
    });

    if (!listing) {
      return Response.json(
        { error: { message: "매물을 찾을 수 없습니다." } },
        { status: 404 }
      );
    }

    if (listing.sellerId !== session.user.id && session.user.role !== "ADMIN") {
      return Response.json(
        { error: { message: "본인의 매물에만 유료 서비스를 적용할 수 있습니다." } },
        { status: 403 }
      );
    }

    const now = new Date();
    const config = SERVICE_CONFIG[parsed.type];

    // 프리미엄/추천 매물은 점프업/자동갱신 구매 차단
    if (parsed.type === "JUMP_UP" || parsed.type === "AUTO_REFRESH") {
      const activePremium = await prisma.premiumListing.findFirst({
        where: { listingId: parsed.listingId, status: "ACTIVE", endDate: { gt: now } },
      });
      if (activePremium) {
        return Response.json(
          { error: { message: "이미 상위 광고가 적용중입니다. 프리미엄/추천 매물은 점프업을 사용할 수 없습니다." } },
          { status: 409 }
        );
      }
    }

    // Type-specific validation
    if (parsed.type === "JUMP_UP") {
      // Check max 3 active today
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayJumpUps = await prisma.paidService.count({
        where: {
          userId: session.user.id,
          type: "JUMP_UP",
          startDate: { gte: todayStart },
        },
      });
      if (todayJumpUps >= 3) {
        return Response.json(
          { error: { message: "끌어올리기는 하루 최대 3회까지 가능합니다." } },
          { status: 429 }
        );
      }
    } else if (parsed.type === "URGENT_TAG") {
      // Check no active URGENT_TAG for this listing
      const activeUrgent = await prisma.paidService.findFirst({
        where: {
          listingId: parsed.listingId,
          type: "URGENT_TAG",
          status: "ACTIVE",
          endDate: { gt: now },
        },
      });
      if (activeUrgent) {
        return Response.json(
          { error: { message: "이 매물에 이미 활성화된 급매 태그가 있습니다." } },
          { status: 409 }
        );
      }
    } else if (parsed.type === "AUTO_REFRESH") {
      // Check no active AUTO_REFRESH for this listing
      const activeRefresh = await prisma.paidService.findFirst({
        where: {
          listingId: parsed.listingId,
          type: "AUTO_REFRESH",
          status: "ACTIVE",
          endDate: { gt: now },
        },
      });
      if (activeRefresh) {
        return Response.json(
          { error: { message: "이 매물에 이미 활성화된 자동갱신이 있습니다." } },
          { status: 409 }
        );
      }
    }

    const endDate = new Date(now.getTime() + config.durationMs);

    const service = await prisma.paidService.create({
      data: {
        userId: session.user.id,
        listingId: parsed.listingId,
        type: parsed.type,
        status: "ACTIVE",
        reason: parsed.type === "URGENT_TAG" ? (parsed.reason ?? null) : null,
        price: config.price,
        startDate: now,
        endDate,
      },
    });

    return Response.json({ data: service }, { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json(
        { error: { message: "인증이 필요합니다." } },
        { status: 401 }
      );
    }

    const services = await prisma.paidService.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        listing: {
          select: { title: true },
        },
      },
    });

    return Response.json({ data: services });
  } catch (error) {
    return errorToResponse(error);
  }
}
