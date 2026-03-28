import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const now = new Date();

    const purchases = await prisma.adPurchase.findMany({
      where: {
        userId: session.user.id,
        status: { in: ["PAID", "EXPIRED"] },
      },
      include: {
        product: {
          select: { id: true, name: true, type: true, price: true, duration: true, categoryScope: true },
        },
        listing: {
          select: { id: true, storeName: true, addressRoad: true },
        },
        equipment: {
          select: { id: true, title: true },
        },
        partnerService: {
          select: { id: true, companyName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const active = purchases.filter(
      (p) => p.status === "PAID" && p.expiresAt && p.expiresAt > now
    );
    const expired = purchases.filter(
      (p) => p.status === "EXPIRED" || (p.status === "PAID" && p.expiresAt && p.expiresAt <= now)
    );

    return NextResponse.json({ active, expired });
  } catch (error) {
    console.error("광고 조회 오류:", error);
    return NextResponse.json(
      { error: "광고 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
