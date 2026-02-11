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
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inquiry = await prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    // Only sender or receiver can view
    if (inquiry.senderId !== session.user.id && inquiry.receiverId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Mark as read if receiver is viewing
    if (inquiry.receiverId === session.user.id && !inquiry.isRead) {
      await prisma.inquiry.update({
        where: { id },
        data: { isRead: true },
      });
    }

    return Response.json({ data: inquiry });
  } catch (error) {
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inquiry = await prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry || inquiry.senderId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.inquiry.delete({ where: { id } });
    return Response.json({ data: { success: true } });
  } catch (error) {
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
