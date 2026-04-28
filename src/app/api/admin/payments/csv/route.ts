import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimitRequest } from "@/lib/rate-limit";

/**
 * 관리자 결제 내역 CSV 다운로드
 * GET /api/admin/payments/csv?status=PAID&scope=LISTING&q=email&from=2026-01-01&to=2026-12-31
 *
 * 한글 깨짐 방지: UTF-8 BOM 포함
 */
export async function GET(request: NextRequest) {
  const rateLimitError = await rateLimitRequest(request, 10, 60000);
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
  const status = searchParams.get("status") || "";
  const scope = searchParams.get("scope") || "";
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

  const items = await prisma.adPurchase.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10000,
    include: {
      user: { select: { id: true, name: true, email: true } },
      product: { select: { name: true, categoryScope: true } },
      listing: { select: { storeName: true } },
      equipment: { select: { title: true } },
    },
  });

  const SCOPE_LABEL: Record<string, string> = {
    LISTING: "매물",
    EQUIPMENT: "집기",
    FRANCHISE: "프랜차이즈",
    PARTNER: "협력업체",
    COMMON: "공통",
  };

  const STATUS_LABEL: Record<string, string> = {
    PENDING: "대기",
    PAID: "결제완료",
    CANCELLED: "취소",
    REFUNDED: "환불",
    EXPIRED: "만료",
  };

  // CSV 셀 이스케이프 (콤마/따옴표/줄바꿈 대응)
  const esc = (v: string | null | undefined) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const header = [
    "결제일시",
    "회원ID",
    "회원명",
    "이메일",
    "상품명",
    "카테고리",
    "대상명",
    "공급가액",
    "VAT",
    "총액",
    "상태",
    "paymentKey",
  ].join(",");

  const rows = items.map((p) => {
    const targetName =
      p.listing?.storeName ||
      p.equipment?.title ||
      "";
    const supply = p.amount;
    const vat = Math.round((supply * 0.1) / 10) * 10;
    const total = supply + vat;
    const dt = new Date(p.createdAt);
    const dtStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")} ${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
    return [
      esc(dtStr),
      esc(p.user.id),
      esc(p.user.name),
      esc(p.user.email),
      esc(p.product.name),
      esc(SCOPE_LABEL[p.product.categoryScope] || p.product.categoryScope),
      esc(targetName),
      esc(String(supply)),
      esc(String(vat)),
      esc(String(total)),
      esc(STATUS_LABEL[p.status] || p.status),
      esc(p.paymentKey),
    ].join(",");
  });

  // UTF-8 BOM (엑셀 한글 깨짐 방지)
  const csv = "﻿" + [header, ...rows].join("\n");

  const today = new Date();
  const filename = `kwonrishop-payments-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
