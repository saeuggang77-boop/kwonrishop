import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_ROLES = ["BUYER", "SELLER", "FRANCHISE", "PARTNER"] as const;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { role } = await req.json();

  if (!role || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "올바른 역할을 선택해주세요." }, { status: 400 });
  }

  // BUYER는 바로 설정, 나머지는 역할만 기록 (사업자인증 필요)
  if (role === "BUYER") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: "BUYER", roleSelectedAt: new Date() },
    });
    return NextResponse.json({ success: true, redirect: "/" });
  }

  // SELLER, FRANCHISE, PARTNER는 roleSelectedAt만 설정하고 사업자인증으로 이동
  await prisma.user.update({
    where: { id: session.user.id },
    data: { roleSelectedAt: new Date() },
  });

  return NextResponse.json({
    success: true,
    redirect: `/verify-business?role=${role}`
  });
}
