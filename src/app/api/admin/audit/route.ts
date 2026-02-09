import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const action = sp.get("action");
  const adminId = sp.get("adminId");
  const cursor = sp.get("cursor");
  const limit = Math.min(Number(sp.get("limit") ?? "50"), 100);

  const logs = await prisma.adminAuditLog.findMany({
    where: {
      ...(action ? { action: action as never } : {}),
      ...(adminId ? { adminId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = logs.length > limit;
  const results = hasMore ? logs.slice(0, limit) : logs;

  return Response.json({
    data: results,
    meta: {
      hasMore,
      cursor: hasMore ? results[results.length - 1].id : undefined,
    },
  });
}
