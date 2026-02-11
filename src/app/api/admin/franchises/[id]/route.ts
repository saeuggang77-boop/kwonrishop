import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorToResponse } from "@/lib/utils/errors";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const updateData: Record<string, unknown> = {};
    if (brandName !== undefined) updateData.brandName = brandName;
    if (category !== undefined) updateData.category = category;
    if (subcategory !== undefined) updateData.subcategory = subcategory;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (monthlyAvgSales !== undefined)
      updateData.monthlyAvgSales = monthlyAvgSales ? BigInt(monthlyAvgSales) : null;
    if (startupCost !== undefined)
      updateData.startupCost = startupCost ? BigInt(startupCost) : null;
    if (storeCount !== undefined) updateData.storeCount = storeCount;
    if (dataYear !== undefined) updateData.dataYear = dataYear;
    if (description !== undefined) updateData.description = description;
    if (isPromoting !== undefined) updateData.isPromoting = isPromoting;

    const franchise = await prisma.franchise.update({
      where: { id },
      data: updateData,
    });

    const data = JSON.parse(
      JSON.stringify(franchise, (_, v) =>
        typeof v === "bigint" ? v.toString() : v
      )
    );

    return Response.json({ data });
  } catch (error) {
    return errorToResponse(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return Response.json(
        { error: { message: "관리자 권한이 필요합니다." } },
        { status: 403 }
      );
    }

    await prisma.franchise.delete({
      where: { id },
    });

    return Response.json({ data: { success: true } });
  } catch (error) {
    return errorToResponse(error);
  }
}
