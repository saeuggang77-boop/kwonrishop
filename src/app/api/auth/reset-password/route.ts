import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, hashToken, validatePasswordStrength } from "@/lib/password";
import { validateOrigin } from "@/lib/csrf";
import { rateLimitRequest } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const rateLimitError = await rateLimitRequest(req, 10, 60000);
  if (rateLimitError) return rateLimitError;

  try {
    const { token, email, password } = await req.json();

    if (!token || !email || !password) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return NextResponse.json({ error: strength.message }, { status: 400 });
    }

    const hashedToken = hashToken(token);
    const identifier = `password-reset:${email.toLowerCase()}`;

    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier,
        token: hashedToken,
      },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "유효하지 않은 재설정 링크입니다." },
        { status: 400 }
      );
    }

    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token: verificationToken.token,
          },
        },
      });
      return NextResponse.json(
        { error: "재설정 링크가 만료되었습니다. 다시 요청해주세요." },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // Update password and delete token in transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { email: email.toLowerCase() },
        data: { password: hashedPassword },
      }),
      prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token: verificationToken.token,
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "비밀번호가 변경되었습니다.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "비밀번호 재설정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
