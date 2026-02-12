import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { smsNotificationEnabled: true },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ data: { smsNotificationEnabled: user.smsNotificationEnabled } });
  } catch (error) {
    console.error("GET /api/user/settings error:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { smsNotificationEnabled } = body;

    if (typeof smsNotificationEnabled !== "boolean") {
      return Response.json(
        { error: "smsNotificationEnabled must be a boolean" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { smsNotificationEnabled },
      select: { smsNotificationEnabled: true },
    });

    return Response.json({ data: { smsNotificationEnabled: updated.smsNotificationEnabled } });
  } catch (error) {
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
