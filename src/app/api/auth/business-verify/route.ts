import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateBusiness } from "@/lib/api/nts";
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
    const result = await validateBusiness(cleanNumber);

    if (!result.valid) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    // 인증 정보 저장 + 역할 업그레이드
    await prisma.$transaction([
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
        data: {
          role: body.requestedRole && ["SELLER", "FRANCHISE", "PARTNER"].includes(body.requestedRole)
            ? body.requestedRole
            : "SELLER",
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("사업자인증 오류:", error);
    return NextResponse.json(
      { error: "인증 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
