import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  const { error: authError, status: authStatus } = await requireAdmin();
  if (authError) return NextResponse.json({ error: authError }, { status: authStatus });

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status") as "PENDING" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | null;

    const where = status ? { status } : {};

    const [inquiries, total] = await Promise.all([
      prisma.contactInquiry.findMany({
        where,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contactInquiry.count({ where }),
    ]);

    return NextResponse.json({
      inquiries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get inquiries error:", error);
    return NextResponse.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { error: authError, status: authStatus } = await requireAdmin();
  if (authError) return NextResponse.json({ error: authError }, { status: authStatus });

  try {
    const { id, status, adminNote } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID가 필요합니다." }, { status: 400 });
    }

    const updateData: any = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (adminNote !== undefined) updateData.adminNote = adminNote;

    const updated = await prisma.contactInquiry.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update inquiry error:", error);
    return NextResponse.json({ error: "수정 중 오류가 발생했습니다." }, { status: 500 });
  }
}
