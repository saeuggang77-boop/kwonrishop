import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/listings/area-stats?addressDong=강남구&categoryId=xxx&excludeId=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const addressDong = searchParams.get("addressDong");
  const categoryId = searchParams.get("categoryId");
  const excludeId = searchParams.get("excludeId");

  if (!addressDong) {
    return NextResponse.json({ error: "addressDong은 필수입니다." }, { status: 400 });
  }

  // 입력 검증: 길이 2~20자, 특수문자 제거, SQL 와일드카드 제거
  const sanitized = addressDong
    .replace(/[%_]/g, "")           // SQL 와일드카드 제거
    .replace(/[^\w가-힣\s]/g, "")    // 특수문자 제거 (한글, 영문, 숫자, 공백만 허용)
    .trim();

  if (sanitized.length < 2 || sanitized.length > 20) {
    return NextResponse.json({ error: "addressDong은 2~20자여야 합니다." }, { status: 400 });
  }

  const where: any = {
    status: "ACTIVE",
    addressRoad: { contains: sanitized },
  };
  if (categoryId) where.categoryId = categoryId;
  if (excludeId) where.id = { not: excludeId };

  const stats = await prisma.listing.aggregate({
    where,
    _avg: { deposit: true, monthlyRent: true, premium: true },
    _count: true,
  });

  return NextResponse.json({
    avgDeposit: Math.round(stats._avg.deposit || 0),
    avgMonthlyRent: Math.round(stats._avg.monthlyRent || 0),
    avgPremium: Math.round(stats._avg.premium || 0),
    count: stats._count,
    area: sanitized,
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' },
  });
}
