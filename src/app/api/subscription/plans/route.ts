import { prisma } from "@/lib/prisma";
import { errorToResponse } from "@/lib/utils/errors";

export async function GET() {
  try {
    let plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    // Auto-activate plans if none are active (dev/seed fix)
    if (plans.length === 0) {
      await prisma.subscriptionPlan.updateMany({
        data: { isActive: true },
      });
      plans = await prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      });
    }

    return new Response(JSON.stringify({ data: plans }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    return errorToResponse(error);
  }
}
