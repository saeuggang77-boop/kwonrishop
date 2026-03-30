import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

// 테스트 전용 시드 API - 개발 환경에서만 동작, CRON_SECRET 인증 필요
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  // CRON_SECRET 인증 (E2E 테스트 호환)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && cronSecret !== "test") {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const TEST_EMAIL = "test-seller@kwonrishop.com";
  const TEST_PASSWORD = "TestPass123!";

  try {
    // 기존 테스트 유저 삭제 (clean state)
    const existing = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
      select: { id: true },
    });

    if (existing) {
      // 관련 데이터 순서대로 삭제
      await prisma.businessVerification.deleteMany({ where: { userId: existing.id } });
      await prisma.listing.deleteMany({ where: { userId: existing.id } });
      await prisma.account.deleteMany({ where: { userId: existing.id } });
      await prisma.session.deleteMany({ where: { userId: existing.id } });
      await prisma.user.delete({ where: { id: existing.id } });
    }

    // 테스트 사장님 유저 생성
    const hashedPw = await hashPassword(TEST_PASSWORD);
    const user = await prisma.user.create({
      data: {
        email: TEST_EMAIL,
        name: "테스트사장님",
        password: hashedPw,
        emailVerified: new Date(),
        role: "SELLER",
        roleSelectedAt: new Date(),
      },
    });

    // 사업자인증 완료 처리
    await prisma.businessVerification.create({
      data: {
        userId: user.id,
        businessNumber: "123-45-67890",
        representativeName: "테스트사장님",
        openDate: "20200101",
        verified: true,
      },
    });

    return NextResponse.json({
      success: true,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      userId: user.id,
    });
  } catch (error) {
    console.error("Test seed error:", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
