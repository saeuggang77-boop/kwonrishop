import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const region = searchParams.get("region") ?? undefined;
    const subRegion = searchParams.get("subRegion") ?? undefined;
    const businessType = searchParams.get("businessType") ?? undefined;

    const where: Record<string, unknown> = {};
    if (region) where.region = region;
    if (subRegion) where.subRegion = subRegion;
    if (businessType) where.businessType = businessType;

    const prices = await prisma.marketPrice.findMany({
      where,
      orderBy: [{ subRegion: "asc" }, { businessType: "asc" }],
    });

    return new Response(
      JSON.stringify({
        data: prices.map((p) => ({
          ...p,
          avgDeposit: Number(p.avgDeposit),
          avgMonthlyRent: Number(p.avgMonthlyRent),
          avgKeyMoney: Number(p.avgKeyMoney),
          avgMonthlySales: Number(p.avgMonthlySales),
        })),
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      },
    );
  } catch (error) {
    console.error("Market prices fetch failed:", error);
    return Response.json({ error: "서버 오류" }, { status: 500 });
  }
}
