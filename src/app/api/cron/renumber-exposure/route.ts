import { NextRequest } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { errorToResponse } from "@/lib/utils/errors";

/**
 * 일일 exposureOrder 재정렬 CRON
 * 매일 자정 실행 — 갭 제거 및 순번 정규화
 *
 * 3개 큐 (premium, recommend, listing) 각각 재번호
 */

interface QueueDef {
  label: string;
  where: Record<string, unknown>;
  orderField: string;
}

const QUEUES: QueueDef[] = [
  {
    label: "premium",
    where: { isPremium: true, premiumRank: { gte: 3 } },
    orderField: "premiumExposureOrder",
  },
  {
    label: "recommend",
    where: { isRecommended: true },
    orderField: "recommendExposureOrder",
  },
  {
    label: "listing",
    where: {},
    orderField: "listingExposureOrder",
  },
];

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const results: Record<string, number> = {};

    for (const queue of QUEUES) {
      const listings = await prisma.listing.findMany({
        where: { status: "ACTIVE", ...queue.where },
        select: { id: true },
        orderBy: { [queue.orderField]: "asc" },
      });

      if (listings.length === 0) {
        results[queue.label] = 0;
        continue;
      }

      await prisma.$transaction(
        listings.map((listing, index) =>
          prisma.listing.update({
            where: { id: listing.id },
            data: { [queue.orderField]: index + 1 },
          }),
        ),
      );

      results[queue.label] = listings.length;
    }

    return Response.json({
      data: { success: true, renumbered: results },
    });
  } catch (error) {
    console.error("[renumber-exposure] CRON failed:", error);
    return errorToResponse(error);
  }
}
