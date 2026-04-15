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
          select: { id: true, storeName: true, addressRoad: true, status: true },
        },
        equipment: {
          select: { id: true, title: true, status: true },
        },
        partnerService: {
          select: { id: true, companyName: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 대상 매물/집기/협력업체가 삭제되었거나 null이면 active로 간주하지 않음 (고아 레코드 방지)
    const isTargetAlive = (p: (typeof purchases)[number]) => {
      if (p.listingId) return !!p.listing && p.listing.status !== "DELETED";
      if (p.equipmentId) return !!p.equipment && p.equipment.status !== "DELETED";
      if (p.partnerServiceId) return !!p.partnerService && p.partnerService.status !== "DELETED";
      return true; // COMMON 카테고리 (target 없음)
    };

    const active = purchases.filter(
      (p) => p.status === "PAID" && (!p.expiresAt || p.expiresAt > now) && isTargetAlive(p)
    );
    const expired = purchases.filter(
      (p) =>
        p.status === "EXPIRED" ||
        (p.status === "PAID" && p.expiresAt && p.expiresAt <= now) ||
        (p.status === "PAID" && !isTargetAlive(p))
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
