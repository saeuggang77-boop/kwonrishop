import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateOrigin } from "@/lib/csrf";

export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ listings: [] });
    }

    const listings = await prisma.listing.findMany({
      where: {
        id: { in: ids },
        status: "ACTIVE",
      },
      select: {
        id: true,
        storeName: true,
        addressRoad: true,
        images: {
          select: { url: true },
          take: 1,
        },
      },
    });

    return NextResponse.json({ listings });
  } catch (error) {
    console.error("Compare preview error:", error);
    return NextResponse.json(
      { error: "비교 미리보기를 불러올 수 없습니다" },
      { status: 500 }
    );
  }
}
