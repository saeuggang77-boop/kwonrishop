import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorToResponse } from "@/lib/utils/errors";
import { serializeBigInt } from "@/lib/utils/bigint-json";
import { createNotification } from "@/lib/notifications/create";
import type { AdminActionType } from "@prisma/client";

export async function POST(
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
    const { action, reason } = body;

    if (!action || !["APPROVE", "HIDE", "DELETE", "FEATURE"].includes(action)) {
      return Response.json(
        { error: { message: "유효하지 않은 액션입니다." } },
        { status: 400 }
      );
    }

    let listing;
    let adminAction;

    switch (action) {
      case "APPROVE":
        listing = await prisma.listing.update({
          where: { id },
          data: { status: "ACTIVE" },
        });
        adminAction = "APPROVE";
        break;

      case "HIDE":
        listing = await prisma.listing.update({
          where: { id },
          data: { status: "HIDDEN" },
        });
        adminAction = "HIDE_LISTING";
        break;

      case "DELETE":
        listing = await prisma.listing.update({
          where: { id },
          data: { status: "DELETED" },
        });
        adminAction = "REJECT";
        break;

      case "FEATURE":
        const currentListing = await prisma.listing.findUnique({
          where: { id },
          select: { isFeatured: true },
        });
        if (!currentListing) {
          return Response.json(
            { error: { message: "매물을 찾을 수 없습니다." } },
            { status: 404 }
          );
        }
        listing = await prisma.listing.update({
          where: { id },
          data: { isFeatured: !currentListing.isFeatured },
        });
        adminAction = currentListing.isFeatured
          ? "HIDE_LISTING"
          : "RESTORE_LISTING";
        break;

      default:
        return Response.json(
          { error: { message: "유효하지 않은 액션입니다." } },
          { status: 400 }
        );
    }

    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        action: adminAction as AdminActionType,
        targetType: "LISTING",
        targetId: id,
        reason: reason ?? null,
      },
    });

    // Notify listing owner
    if (action === "APPROVE" || action === "DELETE") {
      const listingWithUser = await prisma.listing.findUnique({
        where: { id },
        select: { sellerId: true, title: true },
      });

      if (listingWithUser) {
        const isApprove = action === "APPROVE";
        await createNotification({
          userId: listingWithUser.sellerId,
          title: isApprove ? "매물이 승인되었습니다" : "매물이 반려되었습니다",
          message: isApprove
            ? `"${listingWithUser.title}" 매물이 승인되어 공개되었습니다.`
            : `"${listingWithUser.title}" 매물이 반려되었습니다.${reason ? ` 사유: ${reason}` : ""}`,
          link: `/listings/${id}`,
          sourceType: "LISTING",
          sourceId: id,
        });
      }
    }

    return Response.json({ data: serializeBigInt(listing) });
  } catch (error) {
    return errorToResponse(error);
  }
}
