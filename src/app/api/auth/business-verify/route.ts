import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateBusiness } from "@/lib/api/nts";
import { rateLimitRequest } from "@/lib/rate-limit";
import { sanitizeInput } from "@/lib/sanitize";
import { validateOrigin } from "@/lib/csrf";

export async function POST(req: NextRequest) {
  // Rate limiting: 5 requests per minute
  const rateLimitError = await rateLimitRequest(req, 10, 60000);
  if (rateLimitError) return rateLimitError;

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

  // 블랙리스트/쿨다운 체크
  const blacklisted = await prisma.blacklistedBusiness.findUnique({
    where: { businessNumber: cleanNumber },
  });
  if (blacklisted) {
    if (blacklisted.type === "BANNED") {
      return NextResponse.json(
        { error: "제재된 사업자등록번호입니다. 고객센터에 문의해주세요." },
        { status: 403 },
      );
    }
    if (blacklisted.type === "COOLDOWN" && blacklisted.expiresAt && blacklisted.expiresAt > new Date()) {
      const remainDays = Math.ceil((blacklisted.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return NextResponse.json(
        { error: `탈퇴 후 30일간 재인증이 제한됩니다. (${remainDays}일 남음)` },
        { status: 400 },
      );
    }
    // 쿨다운 만료 → 레코드 삭제 후 진행 허용
    if (blacklisted.type === "COOLDOWN" && blacklisted.expiresAt && blacklisted.expiresAt <= new Date()) {
      await prisma.blacklistedBusiness.delete({ where: { businessNumber: cleanNumber } });
    }
  }

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

    // 사용자의 pendingRole 확인 (서버 측 데이터 우선)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { pendingRole: true },
    });

    // pendingRole을 최우선으로 사용, 없으면 안전한 기본값 SELLER
    const requestedRole = user?.pendingRole && ["SELLER", "FRANCHISE", "PARTNER"].includes(user.pendingRole)
      ? user.pendingRole
      : "SELLER";

    // FRANCHISE 역할 요청 시: DB에서 브랜드 매칭
    let matchedBrandId: string | null = null;

    if (requestedRole === "FRANCHISE") {
      // 1) DB에서 사업자번호로 FranchiseBrand 검색
      let brand = await prisma.franchiseBrand.findUnique({
        where: { businessNumber: cleanNumber },
        select: { id: true, managerId: true, brandName: true },
      });

      // 2) DB에 없으면 법인명(사업자명)으로 검색 시도
      if (!brand && cleanBusinessName) {
        brand = await prisma.franchiseBrand.findFirst({
          where: {
            companyName: { contains: cleanBusinessName, mode: 'insensitive' },
          },
          select: { id: true, managerId: true, brandName: true },
        });
      }

      // 3) 여전히 없으면 → 공정위 미등록 브랜드도 가입 허용 (빈 브랜드 자동 생성)
      if (!brand) {
        brand = await prisma.franchiseBrand.create({
          data: {
            ftcId: `manual_${cleanNumber}`,
            brandName: cleanBusinessName || "미등록 브랜드",
            companyName: cleanBusinessName || "",
            businessNumber: cleanNumber,
            industry: "기타",
          },
          select: { id: true, managerId: true, brandName: true },
        });
      }

      // 4) 이미 다른 사용자가 관리자로 등록된 브랜드인지 확인
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
        data: { role: requestedRole as any, pendingRole: null },
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
