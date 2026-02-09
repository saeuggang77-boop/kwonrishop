import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = Number(req.nextUrl.searchParams.get("days") ?? "30");
  const since = new Date();
  since.setDate(since.getDate() - days);

  const metrics = await prisma.dailySellerMetric.findMany({
    where: {
      sellerId: session.user.id,
      date: { gte: since },
    },
    orderBy: { date: "asc" },
  });

  const totals = metrics.reduce(
    (acc, m) => ({
      views: acc.views + m.totalViews,
      inquiries: acc.inquiries + m.totalInquiries,
      ctaClicks: acc.ctaClicks + m.totalCtaClicks,
    }),
    { views: 0, inquiries: 0, ctaClicks: 0 }
  );

  return Response.json({
    data: {
      totals,
      daily: metrics.map((m) => ({
        date: m.date.toISOString().split("T")[0],
        views: m.totalViews,
        inquiries: m.totalInquiries,
        ctaClicks: m.totalCtaClicks,
        conversionRate: m.conversionRate,
        activeListings: m.activeListings,
      })),
    },
  });
}
