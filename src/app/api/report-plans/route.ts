import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const plans = await prisma.reportPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });

    return new Response(
      JSON.stringify({ data: plans.map((p) => ({ ...p, price: Number(p.price) })) }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      },
    );
  } catch (error) {
    console.error("Failed to fetch report plans:", error);
    return Response.json({ error: "서버 오류" }, { status: 500 });
  }
}
