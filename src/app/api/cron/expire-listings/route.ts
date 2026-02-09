import { prisma } from "@/lib/prisma";

export async function POST() {
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
