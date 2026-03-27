import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const count = await prisma.equipment.count({
      where: {
        userId: session.user.id,
        status: {
          notIn: ["DELETED", "SOLD", "EXPIRED"],
        },
      },
    });

    return NextResponse.json({ count, limit: 10 });
  } catch (error) {
    console.error("Equipment my-count error:", error);
    return NextResponse.json(
      { error: "집기 수 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
