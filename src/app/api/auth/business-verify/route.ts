import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateBusiness } from "@/lib/api/nts";
import { searchFranchiseByBusinessNumber } from "@/lib/api/ftc";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeInput } from "@/lib/sanitize";
import { validateOrigin } from "@/lib/csrf";

export async function POST(req: NextRequest) {
  // Rate limiting: 5 requests per minute
  const ip = getClientIp(req);
  const limiter = rateLimit(ip, 5, 60000);
  if (!limiter.success) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  // CSRF protection
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await req.json();
  const { businessNumber, representativeName, openDate, businessName } = body;

  // Sanitize inputs
  const cleanRepName = sanitizeInput(representativeName);
  const cleanBusinessName = businessName ? sanitizeInput(businessName) : null;

  if (!businessNumber || !cleanRepName || !openDate) {
    return NextResponse.json(
      { error: "사업자등록번호, 대표자명, 개업일자는 필수입니다." },
      { status: 400 },
    );
  }

  // 이미 인증된 사용자인지 확인
  const existing = await prisma.businessVerification.findUnique({
    where: { userId: session.user.id },
  });

  if (existing?.verified) {
    return NextResponse.json(
      { error: "이미 사업자인증이 완료되었습니다." },
      { status: 400 },
    );
  }

  // 같은 사업자번호로 이미 인증된 건이 있는지 확인
  const cleanNumber = businessNumber.replace(/-/g, "");
  const duplicateCheck = await prisma.businessVerification.findUnique({
    where: { businessNumber: cleanNumber },
  });

  if (duplicateCheck && duplicateCheck.userId !== session.user.id) {
    return NextResponse.json(
      { error: "이미 다른 계정에서 인증된 사업자등록번호입니다." },
      { status: 400 },
    );
  }

  // 국세청 API 진위확인
  try {
    const result = await validateBusiness(cleanNumber, cleanRepName, openDate, cleanBusinessName || undefined);

    if (!result.valid) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    // 사용자의 pendingRole 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { pendingRole: true },
    });

    const requestedRole = body.requestedRole && ["SELLER", "FRANCHISE", "PARTNER"].includes(body.requestedRole)
      ? body.requestedRole
      : user?.pendingRole && ["SELLER", "FRANCHISE", "PARTNER"].includes(user.pendingRole)
      ? user.pendingRole
      : "SELLER";

    // FRANCHISE 역할 요청 시: 공정위 API로 브랜드 매칭 필수
    let matchedBrandId: string | null = null;

    if (requestedRole === "FRANCHISE") {
      // 1) DB에서 사업자번호로 FranchiseBrand 검색
      let brand = await prisma.franchiseBrand.findUnique({
        where: { businessNumber: cleanNumber },
        select: { id: true, managerId: true, brandName: true },
      });

      // 2) DB에 없으면 공정위 API에서 검색 후 자동 생성
      if (!brand) {
        const ftcResult = await searchFranchiseByBusinessNumber(cleanNumber);

        if (!ftcResult) {
          return NextResponse.json(
            { error: "공정위 정보공개서에 등록된 프랜차이즈만 가입 가능합니다. 해당 사업자번호로 등록된 프랜차이즈 브랜드를 찾을 수 없습니다." },
            { status: 400 },
          );
        }

        // 공정위 데이터로 FranchiseBrand 자동 생성
        brand = await prisma.franchiseBrand.create({
          data: {
            ftcId: ftcResult.ftcId,
            brandName: ftcResult.brandName,
            companyName: ftcResult.companyName,
            businessNumber: cleanNumber,
            industry: ftcResult.industry,
            franchiseFee: ftcResult.franchiseFee,
            educationFee: ftcResult.educationFee,
            depositFee: ftcResult.depositFee,
            royalty: ftcResult.royalty,
            totalStores: ftcResult.totalStores,
            avgRevenue: ftcResult.avgRevenue,
            ftcRegisteredAt: ftcResult.registeredAt,
            ftcRawData: ftcResult.rawData,
          },
          select: { id: true, managerId: true, brandName: true },
        });
      }

      // 3) 이미 다른 사용자가 관리자로 등록된 브랜드인지 확인
      if (brand.managerId && brand.managerId !== session.user.id) {
        return NextResponse.json(
          { error: "이미 다른 관리자가 등록된 브랜드입니다. 본사 담당자 변경은 고객센터에 문의해주세요." },
          { status: 400 },
        );
      }

      matchedBrandId = brand.id;
    }

    // 인증 정보 저장 + 역할 업그레이드 + 프랜차이즈 매칭
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transactionOps: any[] = [
      prisma.businessVerification.upsert({
        where: { userId: session.user.id },
        update: {
          businessNumber: cleanNumber,
          representativeName: cleanRepName,
          openDate,
          businessName: cleanBusinessName,
          verified: true,
          verifiedAt: new Date(),
        },
        create: {
          userId: session.user.id,
          businessNumber: cleanNumber,
          representativeName: cleanRepName,
          openDate,
          businessName: cleanBusinessName,
          verified: true,
          verifiedAt: new Date(),
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { role: requestedRole, pendingRole: null },
      }),
    ];

    // FRANCHISE 매칭 성공 시 managerId 연결
    if (matchedBrandId) {
      transactionOps.push(
        prisma.franchiseBrand.update({
          where: { id: matchedBrandId },
          data: { managerId: session.user.id },
        }),
      );
    }

    await prisma.$transaction(transactionOps);

    return NextResponse.json({
      success: true,
      message: result.message,
      ...(matchedBrandId && { franchiseBrandId: matchedBrandId }),
    });
  } catch (error) {
    console.error("사업자인증 오류:", error);
    return NextResponse.json(
      { error: "인증 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
