import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const reports = await prisma.sellerReport.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        listing: {
          select: { storeName: true, addressRoad: true },
        },
      },
    });

    return NextResponse.json({
      reports: reports.map((r) => ({
        id: r.id,
        listingId: r.listingId,
        listingName: r.listing.storeName || r.listing.addressRoad || "매물",
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Seller reports list error:", error);
    return NextResponse.json(
      { error: "리포트 목록 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
