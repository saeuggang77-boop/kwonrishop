import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimitRequest } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/csrf";
import { sanitizeInput, sanitizeHtml } from "@/lib/sanitize";

export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const rl = rateLimitRequest(req, 3, 60000); // 분당 3회
  if (!rl.success) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  try {
    const { name, email, subject, message } = await req.json();

    // 필수 필드 검증
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "모든 필드를 입력해주세요." }, { status: 400 });
    }

    // 길이 검증
    if (name.length > 50 || email.length > 100 || subject.length > 200 || message.length > 5000) {
      return NextResponse.json({ error: "입력 길이가 초과되었습니다." }, { status: 400 });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "올바른 이메일을 입력해주세요." }, { status: 400 });
    }

    // 문의 생성
    const inquiry = await prisma.contactInquiry.create({
      data: {
        name: sanitizeInput(name),
        email: email.trim().toLowerCase(),
        subject: sanitizeInput(subject),
        message: sanitizeHtml(message),
      },
    });

    // 관리자에게 알림 생성 (ADMIN 역할 사용자에게)
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: "SYSTEM",
          title: "새 고객 문의",
          message: `[${subject.trim()}] ${name.trim()}님의 문의가 접수되었습니다.`,
          link: `/admin/inquiries`,
        })),
      });
    }

    return NextResponse.json({ id: inquiry.id, message: "문의가 접수되었습니다." });
  } catch (error) {
    console.error("Contact inquiry error:", error);
    return NextResponse.json({ error: "문의 접수 중 오류가 발생했습니다." }, { status: 500 });
  }
}
