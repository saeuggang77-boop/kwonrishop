import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateToken, hashToken, validatePasswordStrength } from "@/lib/password";
import { sanitizeInput } from "@/lib/sanitize";
import { validateOrigin } from "@/lib/csrf";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { emailVerificationEmail } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const limit = rateLimit(ip, 3, 60000);
  if (!limit.success) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "이름, 이메일, 비밀번호를 모두 입력해주세요." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "올바른 이메일 형식이 아닙니다." },
        { status: 400 }
      );
    }

    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return NextResponse.json({ error: strength.message }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, password: true },
    });

    if (existingUser) {
      if (existingUser.password) {
        return NextResponse.json(
          { error: "이미 가입된 이메일입니다. 로그인해주세요." },
          { status: 409 }
        );
      } else {
        return NextResponse.json(
          { error: "이 이메일은 소셜 로그인(카카오/네이버)으로 등록되어 있습니다. 소셜 로그인을 이용해주세요." },
          { status: 409 }
        );
      }
    }

    const hashedPassword = await hashPassword(password);
    const sanitizedName = sanitizeInput(name);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: sanitizedName,
        password: hashedPassword,
        emailVerified: null,
      },
    });

    // Generate verification token
    const rawToken = generateToken();
    const hashedToken = hashToken(rawToken);

    // Delete any existing tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: `email-verify:${email.toLowerCase()}` },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: `email-verify:${email.toLowerCase()}`,
        token: hashedToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Send verification email
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${rawToken}&email=${encodeURIComponent(email.toLowerCase())}`;

    const { subject, html } = emailVerificationEmail(sanitizedName, verifyUrl);
    await sendEmail(email.toLowerCase(), subject, html);

    return NextResponse.json({
      success: true,
      message: "인증 이메일이 발송되었습니다. 이메일을 확인해주세요.",
    });
  } catch (error: unknown) {
    // Handle unique constraint violation (race condition)
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
      return NextResponse.json(
        { error: "이미 가입된 이메일입니다." },
        { status: 409 }
      );
    }
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "회원가입 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
