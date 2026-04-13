import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listAllFranchiseBrands } from "@/lib/api/ftc";
import { validateOrigin } from "@/lib/csrf";
import { rateLimitRequest } from "@/lib/rate-limit";

/**
 * FTC API로부터 프랜차이즈 데이터를 가져와 DB에 동기화
 */
export async function POST(request: Request) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const rateLimitError = await rateLimitRequest(request, 3, 60000);
  if (rateLimitError) return rateLimitError;

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

    const body = await request.json();
    const { brandName, ftcId } = body;

    if (!brandName && !ftcId) {
      return NextResponse.json(
        { error: "brandName 또는 ftcId가 필요합니다" },
        { status: 400 }
      );
    }

    let synced = 0;

    // Case 1: Search by ftcId in DB
    if (ftcId) {
      const brand = await prisma.franchiseBrand.findUnique({
        where: { ftcId },
      });

      if (!brand) {
        return NextResponse.json(
          { error: "DB에서 브랜드를 찾을 수 없습니다" },
          { status: 404 }
        );
      }

      synced = 1;
    }
    // Case 2: Search by brand name in DB
    else if (brandName) {
      const brands = await prisma.franchiseBrand.findMany({
        where: {
          brandName: { contains: brandName, mode: 'insensitive' },
        },
      });

      synced = brands.length;
    }

    return NextResponse.json({
      success: true,
      synced,
      message: `${synced}개 브랜드 동기화 완료`,
    });
  } catch (error) {
    console.error("Error syncing franchise data:", error);
    return NextResponse.json(
      { error: "Failed to sync franchise data" },
      { status: 500 }
    );
  }
}

/**
 * PUT: 벌크 임포트 - 전체 목록 가져와서 DB 동기화
 */
export async function PUT(request: Request) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const rateLimitError = await rateLimitRequest(request, 1, 60000); // 1 request per minute for bulk
  if (rateLimitError) return rateLimitError;

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

    const body = await request.json();
    const { mode, page = 1, pageSize = 100 } = body;

    if (mode !== "bulk") {
      return NextResponse.json(
        { error: "mode must be 'bulk'" },
        { status: 400 }
      );
    }

    // Fetch all brands from FTC API
    const result = await listAllFranchiseBrands(page, pageSize);

    // Sync each brand to database
    let synced = 0;
    for (const brand of result.brands) {
      await upsertFranchiseBrand(brand);
      synced++;
    }

    return NextResponse.json({
      success: true,
      synced,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      message: `${synced}개 브랜드 동기화 완료 (페이지 ${result.page}/${result.totalPages})`,
    });
  } catch (error) {
    console.error("Error bulk syncing franchise data:", error);
    return NextResponse.json(
      { error: "Failed to bulk sync franchise data" },
      { status: 500 }
    );
  }
}

/**
 * Helper: Upsert franchise brand to database
 */
async function upsertFranchiseBrand(brand: any) {
  // ftcId: API에 고유ID 없으므로 "법인명_브랜드명" 조합
  const ftcId = `${brand.companyName}_${brand.brandName}`.replace(/\s+/g, '');

  // 기존 레코드 확인 (유료 회원이 직접 등록한 것은 보호)
  const existing = await prisma.franchiseBrand.findUnique({
    where: { ftcId },
    select: { managerId: true, tier: true, tierExpiresAt: true },
  });

  await prisma.franchiseBrand.upsert({
    where: { ftcId },
    update: {
      brandName: brand.brandName,
      companyName: brand.companyName,
      industry: brand.industry,
      totalStores: brand.totalStores || 0,
      avgRevenue: brand.avgRevenue || 0,
      ftcRawData: brand.rawData || {},
      // managerId, tier, tierExpiresAt는 기존 값 유지 (변경하지 않음)
    },
    create: {
      ftcId,
      brandName: brand.brandName,
      companyName: brand.companyName,
      industry: brand.industry,
      totalStores: brand.totalStores || 0,
      avgRevenue: brand.avgRevenue || 0,
      ftcRawData: brand.rawData || {},
      // 새로 생성 시 기본값 (FREE tier)
      tier: "FREE",
    },
  });
}
