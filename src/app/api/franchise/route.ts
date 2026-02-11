import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "12");
    const sortBy = searchParams.get("sortBy") ?? "createdAt";
    const keyword = searchParams.get("keyword");
    const salesMin = searchParams.get("salesMin");
    const salesMax = searchParams.get("salesMax");
    const costMin = searchParams.get("costMin");
    const costMax = searchParams.get("costMax");
    const storeCountMin = searchParams.get("storeCountMin");
    const storeCountMax = searchParams.get("storeCountMax");

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (keyword) {
      where.brandName = { contains: keyword, mode: "insensitive" };
    }

    // BigInt range filters
    const filters: Record<string, unknown>[] = [];
    if (salesMin) {
      filters.push({ monthlyAvgSales: { gte: BigInt(salesMin) } });
    }
    if (salesMax) {
      filters.push({ monthlyAvgSales: { lte: BigInt(salesMax) } });
    }
    if (costMin) {
      filters.push({ startupCost: { gte: BigInt(costMin) } });
    }
    if (costMax) {
      filters.push({ startupCost: { lte: BigInt(costMax) } });
    }
    if (storeCountMin) {
      filters.push({ storeCount: { gte: parseInt(storeCountMin) } });
    }
    if (storeCountMax) {
      filters.push({ storeCount: { lte: parseInt(storeCountMax) } });
    }

    if (filters.length > 0) {
      where.AND = filters;
    }

    // Determine sort order based on field
    let orderBy: Record<string, string>;
    if (sortBy === "startupCost") {
      orderBy = { [sortBy]: "asc" };
    } else {
      orderBy = { [sortBy]: "desc" };
    }

    const [franchises, total] = await Promise.all([
      prisma.franchise.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.franchise.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return Response.json({
      data: franchises.map((f) => ({
        ...f,
        monthlyAvgSales: f.monthlyAvgSales?.toString() ?? null,
        startupCost: f.startupCost?.toString() ?? null,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
