import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const franchise = await prisma.franchise.findUnique({ where: { id } });

    if (!franchise) {
      return Response.json({ error: "프랜차이즈를 찾을 수 없습니다." }, { status: 404 });
    }

    return new Response(
      JSON.stringify({
        data: {
          ...franchise,
          monthlyAvgSales: franchise.monthlyAvgSales?.toString() ?? null,
          startupCost: franchise.startupCost?.toString() ?? null,
        },
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch {
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
