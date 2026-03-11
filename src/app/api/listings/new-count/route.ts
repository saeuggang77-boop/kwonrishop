import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const region = searchParams.get("region");
    const categoryId = searchParams.get("categoryId");
    const maxPremium = searchParams.get("maxPremium");
    const since = searchParams.get("since");

    const where: any = {
      status: "ACTIVE",
    };

    const andConditions = [];

    // Region filter
    if (region) {
      andConditions.push({
        OR: [
          { addressRoad: { contains: region } },
          { addressJibun: { contains: region } },
        ],
      });
    }

    // Category filter
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Premium filter
    if (maxPremium) {
      andConditions.push({
        OR: [
          { premiumNone: true },
          { premium: { lte: parseInt(maxPremium) } },
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Since filter
    if (since) {
      where.createdAt = { gte: new Date(since) };
    }

    const count = await prisma.listing.count({ where });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("New count error:", error);
    return NextResponse.json({ count: 0 });
  }
}
