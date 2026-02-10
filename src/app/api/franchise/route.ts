import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  const sortBy = searchParams.get("sortBy") ?? "monthlyAvgSales";
  const sortOrder = searchParams.get("sortOrder") ?? "desc";

  const where: Record<string, unknown> = {};
  if (category) where.category = category;

  const franchises = await prisma.franchise.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    take: 50,
  });

  return Response.json({
    data: franchises.map((f) => ({
      ...f,
      monthlyAvgSales: f.monthlyAvgSales?.toString() ?? null,
      startupCost: f.startupCost?.toString() ?? null,
    })),
  });
}
