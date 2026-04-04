import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateOrigin } from "@/lib/csrf";
import { rateLimitRequest } from "@/lib/rate-limit";

// 회원탈퇴
export async function DELETE(req: NextRequest) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const rl = rateLimitRequest(req, 3, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다." }, { status: 429 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const userId = session.user.id;

  // 관리자 탈퇴 방지
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role === "ADMIN") {
    return NextResponse.json({ error: "관리자 계정은 탈퇴할 수 없습니다." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { confirmation } = body;

    if (confirmation !== "회원탈퇴") {
      return NextResponse.json({ error: "탈퇴 확인 문구가 일치하지 않습니다." }, { status: 400 });
    }

    // 진행 중인 거래 확인 (RESERVED 매물)
    const reservedListing = await prisma.listing.findFirst({
      where: { userId, status: "RESERVED" },
    });
    if (reservedListing) {
      return NextResponse.json({
        error: "진행 중인 거래가 있어 탈퇴할 수 없습니다. 거래를 완료하거나 취소한 후 다시 시도해 주세요.",
      }, { status: 400 });
    }

    // 소프트 삭제 처리 (트랜잭션)
    await prisma.$transaction(async (tx) => {
      // 매물 비활성화
      await tx.listing.updateMany({
        where: { userId, status: { in: ["ACTIVE", "DRAFT", "EXPIRED"] } },
        data: { status: "DELETED" },
      });

      // 집기 비활성화
      await tx.equipment.updateMany({
        where: { userId, status: "ACTIVE" },
        data: { status: "DELETED" },
      });

      // 협력업체 비활성화
      await tx.partnerService.updateMany({
        where: { userId, status: "ACTIVE" },
        data: { status: "DELETED" },
      });

      // 사업자인증 → 쿨다운 등록 후 삭제
      const bv = await tx.businessVerification.findUnique({
        where: { userId },
        select: { businessNumber: true },
      });
      if (bv) {
        // 기존 블랙리스트 레코드가 있으면 (이미 BANNED 등) 건드리지 않음
        const existing = await tx.blacklistedBusiness.findUnique({
          where: { businessNumber: bv.businessNumber },
        });
        if (!existing) {
          await tx.blacklistedBusiness.create({
            data: {
              businessNumber: bv.businessNumber,
              type: "COOLDOWN",
              reason: "자발적 회원탈퇴",
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일
            },
          });
        }
      }
      await tx.businessVerification.deleteMany({ where: { userId } });

      // 프랜차이즈 브랜드 관리자 해제 (새 관리자 등록 허용)
      await tx.franchiseBrand.updateMany({
        where: { managerId: userId },
        data: { managerId: null },
      });

      // 세션/인증/토큰 삭제
      await tx.session.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });
      await tx.pushToken.deleteMany({ where: { userId } });

      // 즐겨찾기/알림 삭제
      await tx.favorite.deleteMany({ where: { userId } });
      await tx.equipmentFavorite.deleteMany({ where: { userId } });
      await tx.notification.deleteMany({ where: { userId } });

      // 유저 개인정보 익명화 (소프트 삭제)
      await tx.user.update({
        where: { id: userId },
        data: {
          email: `withdrawn_${userId}@withdrawn.local`,
          name: "탈퇴회원",
          phone: null,
          image: null,
          password: null,
          pendingRole: null,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "회원 탈퇴가 완료되었습니다.",
    });
  } catch (error) {
    console.error("회원 탈퇴 오류:", error);
    return NextResponse.json({
      error: "회원 탈퇴 처리 중 오류가 발생했습니다.",
    }, { status: 500 });
  }
}
