import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateOrigin } from "@/lib/csrf";
import { sanitizeHtml, sanitizeInput } from "@/lib/sanitize";

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

// 프랜차이즈 브랜드 편집 (본사 소유자만)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { id } = await params;

    // 사용자 역할 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "FRANCHISE" && user?.role !== "ADMIN") {
      return NextResponse.json({ error: "프랜차이즈 본사만 편집할 수 있습니다." }, { status: 403 });
    }

    // 브랜드 조회
    const brand = await prisma.franchiseBrand.findUnique({
      where: { id },
      select: { managerId: true, businessNumber: true },
    });

    if (!brand) {
      return NextResponse.json({ error: "브랜드를 찾을 수 없습니다." }, { status: 404 });
    }

    // 소유권 확인: managerId 또는 사업자번호 일치
    if (user?.role !== "ADMIN") {
      if (brand.managerId !== session.user.id) {
        // 사업자번호로도 확인
        const verification = await prisma.businessVerification.findUnique({
          where: { userId: session.user.id },
          select: { businessNumber: true },
        });

        if (!verification?.businessNumber || verification.businessNumber !== brand.businessNumber) {
          return NextResponse.json({ error: "본인의 브랜드만 편집할 수 있습니다." }, { status: 403 });
        }
      }
    }

    const body = await request.json();

    // 편집 가능 필드만 업데이트 (공정위 기본 데이터는 수정 불가)
    const updated = await prisma.franchiseBrand.update({
      where: { id },
      data: {
        logo: body.logo !== undefined ? body.logo : undefined,
        bannerImage: body.bannerImage !== undefined ? body.bannerImage : undefined,
        description: body.description !== undefined ? sanitizeHtml(body.description) : undefined,
        benefits: body.benefits !== undefined ? sanitizeHtml(body.benefits) : undefined,
        contactPhone: body.contactPhone !== undefined ? sanitizeInput(body.contactPhone || "") : undefined,
        contactEmail: body.contactEmail !== undefined ? sanitizeInput(body.contactEmail || "") : undefined,
        website: body.website !== undefined ? sanitizeInput(body.website || "") : undefined,
        // managerId 연결 (첫 편집 시)
        ...(brand.managerId === null ? { managerId: session.user.id } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating franchise brand:", error);
    return NextResponse.json({ error: "브랜드 수정 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// PATCH: PUT과 동일한 로직 (편집 페이지에서 사용)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(request, { params });
}
