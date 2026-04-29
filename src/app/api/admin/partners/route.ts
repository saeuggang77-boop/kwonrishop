import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const status = searchParams.get("status") || "";
    const keyword = searchParams.get("keyword") || "";
    const tier = searchParams.get("tier") || "";

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (tier) {
      where.tier = tier;
    }

    if (keyword) {
      where.OR = [
        { companyName: { contains: keyword, mode: "insensitive" } },
        { user: { name: { contains: keyword, mode: "insensitive" } } },
        { user: { email: { contains: keyword, mode: "insensitive" } } },
      ];
    }

    const [partners, total] = await Promise.all([
      prisma.partnerService.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.partnerService.count({ where }),
    ]);

    return NextResponse.json({
      partners,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching admin partners:", error);
    return NextResponse.json(
      { error: "Failed to fetch partners" },
      { status: 500 }
    );
  }
}
