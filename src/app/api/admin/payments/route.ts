import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimitRequest } from "@/lib/rate-limit";

/**
 * 관리자 결제 내역 조회 (시간순)
 * GET /api/admin/payments?page=1&limit=50&status=PAID&scope=LISTING&q=email&from=2026-01-01&to=2026-12-31
 */
export async function GET(request: NextRequest) {
  const rateLimitError = await rateLimitRequest(request, 60, 60000);
  if (rateLimitError) return rateLimitError;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (me?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const status = searchParams.get("status") || ""; // PAID/REFUNDED/PENDING/CANCELLED/EXPIRED
  const scope = searchParams.get("scope") || ""; // LISTING/EQUIPMENT/FRANCHISE/PARTNER/COMMON
  const q = (searchParams.get("q") || "").trim();
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const where: any = {};
  if (status) where.status = status;
  if (scope) where.product = { categoryScope: scope };
  if (q) {
    where.user = {
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    };
  }
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const [total, items] = await Promise.all([
    prisma.adPurchase.count({ where }),
    prisma.adPurchase.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: {
          select: { name: true, categoryScope: true, price: true, type: true },
        },
        listing: { select: { id: true, storeName: true, addressJibun: true } },
        equipment: { select: { id: true, title: true } },
      },
    }),
  ]);

  return NextResponse.json({
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
