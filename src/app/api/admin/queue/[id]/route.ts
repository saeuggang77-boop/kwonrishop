import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { errorToResponse, NotFoundError } from "@/lib/utils/errors";
import { z } from "zod/v4";

const actionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "REQUEST_MORE_INFO"]),
  reason: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return Response.json({ error: { message: "관리자 권한이 필요합니다." } }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, reason } = actionSchema.parse(body);

    const violation = await prisma.fraudViolation.findUnique({
      where: { id },
      include: { listing: { select: { id: true, sellerId: true, title: true } } },
    });

    if (!violation) throw new NotFoundError("위반 건을 찾을 수 없습니다.");

    // Update violation status
    const violationStatus = action === "APPROVE" ? "APPROVED" : action === "REJECT" ? "REJECTED" : "PENDING";

    await prisma.fraudViolation.update({
      where: { id },
      data: {
        status: violationStatus,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewNote: reason,
      },
    });

    // Apply listing action
    if (action === "APPROVE") {
      await prisma.listing.update({
        where: { id: violation.listingId },
        data: { status: "ACTIVE" },
      });
    } else if (action === "REJECT") {
      await prisma.listing.update({
        where: { id: violation.listingId },
        data: { status: "HIDDEN" },
      });
      await prisma.user.update({
        where: { id: violation.userId },
        data: { violationCount: { increment: 1 } },
      });
    }

    // Notify seller
    if (action === "REQUEST_MORE_INFO") {
      await prisma.notification.create({
        data: {
          userId: violation.listing.sellerId,
          title: "추가 정보 요청",
          message: `매물 "${violation.listing.title}"에 대해 추가 정보가 필요합니다. ${reason ?? "대시보드에서 확인해주세요."}`,
          link: `/dashboard/listings`,
          sourceType: "fraud",
          sourceId: violation.listingId,
        },
      });
    }

    // Audit log
    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        action: action as "APPROVE" | "REJECT" | "REQUEST_MORE_INFO",
        targetType: "fraud_violation",
        targetId: id,
        reason,
        metadata: {
          listingId: violation.listingId,
          violationSeverity: violation.severity,
        },
      },
    });

    return Response.json({ data: { success: true, action } });
  } catch (error) {
    return errorToResponse(error);
  }
}
