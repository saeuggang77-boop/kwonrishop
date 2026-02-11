import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        violationCount: true,
        createdAt: true,
        _count: {
          select: { listings: true },
        },
      },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ data: user });
  } catch (error) {
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { action, reason } = await req.json();

    if (action === "SUSPEND") {
      await prisma.user.update({
        where: { id },
        data: { accountStatus: "SUSPENDED" },
      });

      await prisma.adminAuditLog.create({
        data: {
          adminId: session.user.id,
          action: "SUSPEND_USER",
          targetType: "user",
          targetId: id,
          reason: reason ?? null,
        },
      });
    } else if (action === "ACTIVATE") {
      await prisma.user.update({
        where: { id },
        data: { accountStatus: "ACTIVE" },
      });

      await prisma.adminAuditLog.create({
        data: {
          adminId: session.user.id,
          action: "UNSUSPEND_USER",
          targetType: "user",
          targetId: id,
          reason: reason ?? null,
        },
      });
    } else {
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    return Response.json({ data: { success: true } });
  } catch (error) {
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
