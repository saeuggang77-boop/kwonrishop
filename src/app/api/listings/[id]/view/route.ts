import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const listing = await prisma.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });

    return NextResponse.json({ success: true, viewCount: listing.viewCount });
  } catch {
    return NextResponse.json(
      { error: "매물을 찾을 수 없습니다" },
      { status: 404 }
    );
  }
}
