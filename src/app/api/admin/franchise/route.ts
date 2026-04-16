import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20") || 20));
    const tier = searchParams.get("tier") || "";
    const keyword = searchParams.get("keyword") || "";

    const where: any = {};

    if (tier) {
      where.tier = tier;
    }

    if (keyword) {
      where.OR = [
        { brandName: { contains: keyword, mode: "insensitive" } },
        { companyName: { contains: keyword, mode: "insensitive" } },
      ];
    }

    const [brands, total] = await Promise.all([
      prisma.franchiseBrand.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ tier: "desc" }, { createdAt: "desc" }],
      }),
      prisma.franchiseBrand.count({ where }),
    ]);

    return NextResponse.json({
      brands,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error fetching admin franchise:", err);
    return NextResponse.json({ error: "Failed to fetch franchise brands" }, { status: 500 });
  }
}
