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

    return Response.json({
      data: {
        ...franchise,
        monthlyAvgSales: franchise.monthlyAvgSales?.toString() ?? null,
        startupCost: franchise.startupCost?.toString() ?? null,
      },
    });
  } catch {
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
