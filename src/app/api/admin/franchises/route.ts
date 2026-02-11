import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorToResponse } from "@/lib/utils/errors";
import { serializeBigInt } from "@/lib/utils/bigint-json";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return Response.json(
        { error: { message: "관리자 권한이 필요합니다." } },
        { status: 403 }
      );
    }

    const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1");
    const limit = Math.min(
      parseInt(req.nextUrl.searchParams.get("limit") ?? "50"),
      100
    );

    const [franchises, total] = await Promise.all([
      prisma.franchise.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.franchise.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return Response.json({
      data: serializeBigInt(franchises),
      meta: { total, page, limit, totalPages },
    });
  } catch (error) {
    return errorToResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return Response.json(
        { error: { message: "관리자 권한이 필요합니다." } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      brandName,
      category,
      subcategory,
      logoUrl,
      monthlyAvgSales,
      startupCost,
      storeCount,
      dataYear,
      description,
      isPromoting,
    } = body;

    if (!brandName || !category || !subcategory) {
      return Response.json(
        { error: { message: "필수 필드가 누락되었습니다." } },
        { status: 400 }
      );
    }

    const franchise = await prisma.franchise.create({
      data: {
        brandName,
        category,
        subcategory,
        logoUrl: logoUrl ?? null,
        monthlyAvgSales: monthlyAvgSales ? BigInt(monthlyAvgSales) : null,
        startupCost: startupCost ? BigInt(startupCost) : null,
        storeCount: storeCount ?? null,
        dataYear: dataYear ?? null,
        description: description ?? null,
        isPromoting: isPromoting ?? false,
      },
    });

    return Response.json({ data: serializeBigInt(franchise) }, { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}
