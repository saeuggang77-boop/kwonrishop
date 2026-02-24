import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.wantedRequest.findUnique({
      where: { id },
    });
    if (!existing) {
      return Response.json({ error: "의뢰를 찾을 수 없습니다." }, { status: 404 });
    }
    if (existing.userId !== session.user.id) {
      return Response.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await req.json();
    const validStatuses = ["ACTIVE", "PAUSED", "COMPLETED"];
    if (!body.status || !validStatuses.includes(body.status)) {
      return Response.json(
        { error: "유효하지 않은 상태값입니다." },
        { status: 400 }
      );
    }

    const updated = await prisma.wantedRequest.update({
      where: { id },
      data: { status: body.status },
    });

    return Response.json({
      data: {
        ...updated,
        budgetMin: updated.budgetMin?.toString() ?? null,
        budgetMax: updated.budgetMax?.toString() ?? null,
        monthlyRentMax: updated.monthlyRentMax?.toString() ?? null,
      },
    });
  } catch (error) {
    console.error("PATCH /api/wanted-requests/[id] error:", error);
    return Response.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.wantedRequest.findUnique({
      where: { id },
    });
    if (!existing) {
      return Response.json({ error: "의뢰를 찾을 수 없습니다." }, { status: 404 });
    }
    if (existing.userId !== session.user.id) {
      return Response.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    await prisma.wantedRequest.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/wanted-requests/[id] error:", error);
    return Response.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
