import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, validatePasswordStrength } from "@/lib/password";
import { validateOrigin } from "@/lib/csrf";
import { rateLimitRequest } from "@/lib/rate-limit";

// 비밀번호 변경
export async function PATCH(req: NextRequest) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const rl = rateLimitRequest(req, 10, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다." }, { status: 429 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "현재 비밀번호와 새 비밀번호를 입력해주세요." }, { status: 400 });
    }

    // 사용자 조회 (password 포함)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user?.password) {
      return NextResponse.json({
        error: "소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.",
      }, { status: 400 });
    }

    // 현재 비밀번호 확인
    const isValid = await verifyPassword(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "현재 비밀번호가 일치하지 않습니다." }, { status: 400 });
    }

    // 새 비밀번호 강도 검증
    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return NextResponse.json({ error: strength.message }, { status: 400 });
    }

    // 현재와 동일한 비밀번호 차단
    const isSame = await verifyPassword(newPassword, user.password);
    if (isSame) {
      return NextResponse.json({ error: "현재 비밀번호와 다른 비밀번호를 입력해주세요." }, { status: 400 });
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, message: "비밀번호가 변경되었습니다." });
  } catch (error) {
    console.error("비밀번호 변경 오류:", error);
    return NextResponse.json({ error: "비밀번호 변경 중 오류가 발생했습니다." }, { status: 500 });
  }
}
