import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateOrigin } from "@/lib/csrf";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const VALID_ROLES = ["BUYER", "SELLER", "FRANCHISE", "PARTNER"] as const;

export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rl = rateLimit(ip, 5, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다." }, { status: 429 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { role } = await req.json();

  if (!role || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "올바른 역할을 선택해주세요." }, { status: 400 });
  }

  // BUYER는 바로 설정, 나머지는 pendingRole에 저장 (사업자인증 필요)
  if (role === "BUYER") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: "BUYER", roleSelectedAt: new Date(), pendingRole: null },
    });
    return NextResponse.json({ success: true, redirect: "/" });
  }

  // SELLER, FRANCHISE, PARTNER는 pendingRole에 저장하고 사업자인증으로 이동
  await prisma.user.update({
    where: { id: session.user.id },
    data: { pendingRole: role, roleSelectedAt: new Date() },
  });

  return NextResponse.json({
    success: true,
    redirect: `/verify-business?role=${role}`
  });
}
