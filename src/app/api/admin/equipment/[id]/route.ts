import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateOrigin } from "@/lib/csrf";
import { rateLimitRequest } from "@/lib/rate-limit";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const rateLimitError = await rateLimitRequest(request, 30, 60000);
  if (rateLimitError) return rateLimitError;

  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = ["ACTIVE", "RESERVED", "SOLD", "EXPIRED", "DELETED"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Update equipment status
    const equipment = await prisma.equipment.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(equipment);
  } catch (error: any) {
    console.error("Error updating equipment status:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Equipment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update equipment status" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const rateLimitError = await rateLimitRequest(request, 30, 60000);
  if (rateLimitError) return rateLimitError;

  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 소프트 삭제로 변경 (실수 복구 가능, 매물·협력업체와 일관성)
    // 관련 AdPurchase도 자동 종료 (환불 없음 — 약관 제10조)
    const now = new Date();
    await prisma.$transaction([
      prisma.equipment.update({
        where: { id },
        data: {
          status: "DELETED",
          tier: "FREE",
          tierExpiresAt: null,
        },
      }),
      prisma.adPurchase.updateMany({
        where: {
          equipmentId: id,
          status: "PAID",
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        data: {
          status: "EXPIRED",
          expiresAt: now,
        },
      }),
    ]);

    return NextResponse.json({ success: true, message: "집기가 삭제되었습니다." });
  } catch (error: any) {
    console.error("Error deleting equipment:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Equipment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete equipment" },
      { status: 500 }
    );
  }
}
