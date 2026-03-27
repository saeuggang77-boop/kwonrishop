import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/password";
import { validateOrigin } from "@/lib/csrf";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { emailVerificationEmail } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const limit = rateLimit(ip, 2, 300000); // 2 requests per 5 minutes
  if (!limit.success) {
    return NextResponse.json(
      { error: "인증 메일은 5분에 1회만 재발송할 수 있습니다." },
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

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true, password: true, emailVerified: true },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "이메일 회원가입 계정을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "이미 인증된 이메일입니다. 로그인해주세요." },
        { status: 400 }
      );
    }

    // Delete existing tokens
    await prisma.verificationToken.deleteMany({
      where: { identifier: `email-verify:${email.toLowerCase()}` },
    });

    const rawToken = generateToken();
    const hashedToken = hashToken(rawToken);

    await prisma.verificationToken.create({
      data: {
        identifier: `email-verify:${email.toLowerCase()}`,
        token: hashedToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${rawToken}&email=${encodeURIComponent(email.toLowerCase())}`;

    const { subject, html } = emailVerificationEmail(user.name || "회원", verifyUrl);
    await sendEmail(email.toLowerCase(), subject, html);

    return NextResponse.json({
      success: true,
      message: "인증 이메일이 재발송되었습니다.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "인증 메일 재발송 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
