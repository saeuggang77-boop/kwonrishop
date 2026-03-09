import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const brand = await prisma.franchiseBrand.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            inquiries: true,
          },
        },
      },
    });

    if (!brand) {
      return NextResponse.json(
        { error: "Franchise brand not found" },
        { status: 404 }
      );
    }

    // Transform to include inquiryCount
    const transformedBrand = {
      ...brand,
      inquiryCount: brand._count.inquiries,
      _count: undefined,
    };

    return NextResponse.json(transformedBrand, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error("Error fetching franchise brand:", error);
    return NextResponse.json(
      { error: "Failed to fetch franchise brand" },
      { status: 500 }
    );
  }
}
