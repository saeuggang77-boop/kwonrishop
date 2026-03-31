import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeInput, validatePhone } from "@/lib/sanitize";
import { validateOrigin } from "@/lib/csrf";
import { sendPushToUser } from "@/lib/push";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting: 5 inquiries per minute
    const ip = getClientIp(request);
    const limiter = rateLimit(ip, 5, 60000);
    if (!limiter.success) {
      return NextResponse.json(
        { error: "문의 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    // CSRF protection
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    // 로그인 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, phone, message } = body;

    // Sanitize inputs
    const cleanName = sanitizeInput(name);
    const cleanPhone = sanitizeInput(phone);
    const cleanMessage = message ? sanitizeInput(message) : null;

    // Validate required fields
    if (!cleanName || !cleanPhone) {
      return NextResponse.json(
        { error: "이름과 전화번호는 필수입니다." },
        { status: 400 }
      );
    }

    // Validate phone format
    if (!validatePhone(cleanPhone)) {
      return NextResponse.json(
        { error: "유효하지 않은 전화번호 형식입니다." },
        { status: 400 }
      );
    }

    // Verify franchise brand exists
    const brand = await prisma.franchiseBrand.findUnique({
      where: { id },
    });

    if (!brand) {
      return NextResponse.json(
        { error: "Franchise brand not found" },
        { status: 404 }
      );
    }

    // Create inquiry
    const inquiry = await prisma.franchiseInquiry.create({
      data: {
        brandId: id,
        userId: session.user.id,
        name: cleanName,
        phone: cleanPhone,
        message: cleanMessage,
      },
    });

    // 프랜차이즈 본사에게 문의 알림 (비차단)
    (async () => {
      try {
        const brandWithManager = await prisma.franchiseBrand.findUnique({
          where: { id },
          select: { brandName: true, managerId: true },
        });

        if (brandWithManager?.managerId) {
          // DB 알림
          await prisma.notification.create({
            data: {
              userId: brandWithManager.managerId,
              type: "FRANCHISE_INQUIRY",
              title: "새 가맹 문의",
              message: `${brandWithManager.brandName}에 새 가맹 문의가 도착했습니다.`,
              link: `/franchise/${id}`,
            },
          });

          // 웹 푸시
          sendPushToUser(
            brandWithManager.managerId,
            "새 가맹 문의",
            `${brandWithManager.brandName}에 새 가맹 문의가 도착했습니다.`,
            `/franchise/${id}`
          ).catch(() => {});
        }
      } catch (err) {
        console.error("[Notification] Failed to send inquiry notification:", err);
      }
    })();

    return NextResponse.json(inquiry, { status: 201 });
  } catch (error) {
    console.error("Error creating franchise inquiry:", error);
    return NextResponse.json(
      { error: "Failed to submit inquiry" },
      { status: 500 }
    );
  }
}
