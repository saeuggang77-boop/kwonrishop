import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        image: true,
        emailVerified: true,
        businessName: true,
        businessNumber: true,
        subscriptionTier: true,
        createdAt: true,
        _count: {
          select: {
            listings: true,
            inquiriesSent: true,
            reportPurchases: true,
            simulations: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ data: user });
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, businessName, businessNumber } = body;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(businessName !== undefined && { businessName }),
        ...(businessNumber !== undefined && { businessNumber }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        image: true,
        businessName: true,
        businessNumber: true,
        subscriptionTier: true,
      },
    });

    return NextResponse.json({ data: user });
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
