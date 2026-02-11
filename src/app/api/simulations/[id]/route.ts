import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorToResponse } from "@/lib/utils/errors";

// DELETE - delete a simulation
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: { message: "로그인이 필요합니다." } }, { status: 401 });
    }

    const simulation = await prisma.simulation.findUnique({ where: { id } });
    if (!simulation || simulation.userId !== session.user.id) {
      return Response.json({ error: { message: "시뮬레이션을 찾을 수 없습니다." } }, { status: 404 });
    }

    await prisma.simulation.delete({ where: { id } });
    return Response.json({ data: { success: true } });
  } catch (error) {
    return errorToResponse(error);
  }
}
