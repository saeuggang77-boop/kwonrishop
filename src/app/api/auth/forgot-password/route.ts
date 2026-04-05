import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/password";
import { validateOrigin } from "@/lib/csrf";
import { rateLimitRequest } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const limit = rateLimitRequest(req, 10, 60000);
  if (!limit.success) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "이메일을 입력해주세요." },
        { status: 400 }
      );
    }

    // Always return success to prevent email enumeration
    const successResponse = {
      success: true,
      message: "입력하신 이메일로 비밀번호 재설정 링크를 보냈습니다.",
    };

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true, password: true },
    });

    // If user not found or social-only user, return success without sending email
    if (!user || !user.password) {
      return NextResponse.json(successResponse);
    }

    // Delete existing password reset tokens
    await prisma.verificationToken.deleteMany({
      where: { identifier: `password-reset:${email.toLowerCase()}` },
    });

    const rawToken = generateToken();
    const hashedToken = hashToken(rawToken);

    await prisma.verificationToken.create({
      data: {
        identifier: `password-reset:${email.toLowerCase()}`,
        token: hashedToken,
        expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/forgot-password?step=reset&token=${rawToken}&email=${encodeURIComponent(email.toLowerCase())}`;

    const { subject, html } = passwordResetEmail(user.name || "회원", resetUrl);
    await sendEmail(email.toLowerCase(), subject, html);

    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "비밀번호 재설정 요청 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
