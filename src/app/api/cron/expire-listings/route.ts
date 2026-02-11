import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/cron-auth";

export async function POST(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await prisma.listing.updateMany({
      where: {
        status: "ACTIVE",
        expiresAt: { lte: new Date() },
      },
      data: { status: "EXPIRED" },
    });

    return Response.json({
      data: { success: true, expiredCount: result.count },
    });
  } catch (error) {
    console.error("Listing expiration CRON failed:", error);
    return Response.json({ error: "Expiration failed" }, { status: 500 });
  }
}
