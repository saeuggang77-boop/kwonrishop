import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/ses/send";
import { welcomeEmail } from "@/lib/ses/templates";
import { checkRateLimit } from "@/lib/rate-limit";

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    try {
      const limited = await checkRateLimit(`register:${ip}`, 5, 300);
      if (limited) return limited;
    } catch {}

    const { name, email, phone, password, role, expertCategory } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "이름, 이메일, 비밀번호는 필수입니다." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "비밀번호는 8자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    const validRoles = ["BUYER", "SELLER", "AGENT", "FRANCHISE", "EXPERT"];
    const userRole = validRoles.includes(role) ? role : "BUYER";
    const validExpertCategories = ["LAW", "ACCOUNTING", "INTERIOR", "DEMOLITION", "REALESTATE"];
    const userExpertCategory = userRole === "EXPERT" && validExpertCategories.includes(expertCategory) ? expertCategory : null;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "이미 가입된 이메일입니다." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        hashedPassword,
        role: userRole,
        expertCategory: userExpertCategory,
        accountStatus: "ACTIVE",
      },
    });

    // Create verification token and send email
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    const verifyUrl = `${BASE_URL}/api/auth/verify-email?token=${token}`;
    const emailContent = welcomeEmail({ name, verifyUrl });

    // Fire-and-forget: don't block registration on email delivery
    sendEmail({ to: email, subject: emailContent.subject, html: emailContent.html }).catch(
      (err) => console.error("Failed to send verification email:", err)
    );

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
