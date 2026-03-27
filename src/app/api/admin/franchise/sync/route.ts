import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchFranchiseBrands, getFranchiseBrandDetail } from "@/lib/api/ftc";
import { validateOrigin } from "@/lib/csrf";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * FTC API로부터 프랜차이즈 데이터를 가져와 DB에 동기화
 */
export async function POST(request: Request) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rl = rateLimit(ip, 3, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다." }, { status: 429 });
  }

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

    // Case 1: Import specific brand by ftcId
    if (ftcId) {
      const brandDetail = await getFranchiseBrandDetail(ftcId);
      if (!brandDetail) {
        return NextResponse.json(
          { error: "FTC API에서 브랜드를 찾을 수 없습니다" },
          { status: 404 }
        );
      }

      await upsertFranchiseBrand(brandDetail);
      synced = 1;
    }
    // Case 2: Search and import by brand name
    else if (brandName) {
      const searchResult = await searchFranchiseBrands(brandName, 1);

      for (const brand of searchResult.brands) {
        // Get full detail for each brand
        const brandDetail = await getFranchiseBrandDetail(brand.ftcId);
        if (brandDetail) {
          await upsertFranchiseBrand(brandDetail);
          synced++;
        }
      }
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
 * Helper: Upsert franchise brand to database
 */
async function upsertFranchiseBrand(brandDetail: any) {
  await prisma.franchiseBrand.upsert({
    where: { ftcId: brandDetail.ftcId },
    update: {
      brandName: brandDetail.brandName,
      companyName: brandDetail.companyName,
      businessNumber: brandDetail.businessNumber,
      industry: brandDetail.industry,
      franchiseFee: brandDetail.franchiseFee,
      educationFee: brandDetail.educationFee,
      depositFee: brandDetail.depositFee,
      royalty: brandDetail.royalty,
      totalStores: brandDetail.totalStores,
      avgRevenue: brandDetail.avgRevenue,
      ftcRegisteredAt: brandDetail.registeredAt,
      ftcRawData: brandDetail.rawData,
    },
    create: {
      ftcId: brandDetail.ftcId,
      brandName: brandDetail.brandName,
      companyName: brandDetail.companyName,
      businessNumber: brandDetail.businessNumber,
      industry: brandDetail.industry,
      franchiseFee: brandDetail.franchiseFee,
      educationFee: brandDetail.educationFee,
      depositFee: brandDetail.depositFee,
      royalty: brandDetail.royalty,
      totalStores: brandDetail.totalStores,
      avgRevenue: brandDetail.avgRevenue,
      ftcRegisteredAt: brandDetail.registeredAt,
      ftcRawData: brandDetail.rawData,
    },
  });
}
