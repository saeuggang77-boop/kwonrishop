import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeInput, validatePhone } from "@/lib/sanitize";
import { validateOrigin } from "@/lib/csrf";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// 프로필 업데이트
export async function PATCH(req: NextRequest) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rl = rateLimit(ip, 10, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다." }, { status: 429 });
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, phone, image } = body;

    // 업데이트할 데이터 구성 (값이 있는 필드만 포함)
    const updateData: { name?: string; phone?: string; image?: string } = {};
    if (name !== undefined) updateData.name = sanitizeInput(name);
    if (phone !== undefined) {
      const sanitizedPhone = sanitizeInput(phone);
      if (sanitizedPhone && !validatePhone(sanitizedPhone)) {
        return NextResponse.json({ error: "유효하지 않은 전화번호 형식입니다." }, { status: 400 });
      }
      updateData.phone = sanitizedPhone;
    }
    if (image !== undefined) {
      const url = (image || "").toLowerCase();
      if (url && !url.startsWith("/uploads/") && !url.startsWith("https://")) {
        return NextResponse.json({ error: "허용되지 않은 이미지 URL입니다." }, { status: 400 });
      }
      if (url.startsWith("javascript:") || url.startsWith("data:")) {
        return NextResponse.json({ error: "허용되지 않은 이미지 URL입니다." }, { status: 400 });
      }
      updateData.image = image;
    }

    // 업데이트할 내용이 없는 경우
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "업데이트할 내용이 없습니다." },
        { status: 400 }
      );
    }

    // 사용자 프로필 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("프로필 업데이트 오류:", error);
    return NextResponse.json(
      { error: "프로필 업데이트 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
