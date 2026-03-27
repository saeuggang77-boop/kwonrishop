import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ verified: false }, { status: 401 });
    }

    const verification = await prisma.businessVerification.findUnique({
      where: { userId: session.user.id },
      select: { verified: true },
    });

    return NextResponse.json({
      verified: verification?.verified ?? false,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
