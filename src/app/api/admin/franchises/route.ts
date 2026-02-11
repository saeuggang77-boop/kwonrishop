import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorToResponse } from "@/lib/utils/errors";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return Response.json(
        { error: { message: "관리자 권한이 필요합니다." } },
        { status: 403 }
      );
    }

    const franchises = await prisma.franchise.findMany({
      orderBy: { createdAt: "desc" },
    });

    const data = JSON.parse(
      JSON.stringify(franchises, (_, v) =>
        typeof v === "bigint" ? v.toString() : v
      )
    );

    return Response.json({ data });
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

    const data = JSON.parse(
      JSON.stringify(franchise, (_, v) =>
        typeof v === "bigint" ? v.toString() : v
      )
    );

    return Response.json({ data }, { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}
