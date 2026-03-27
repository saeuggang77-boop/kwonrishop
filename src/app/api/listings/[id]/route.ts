import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml, sanitizeInput } from "@/lib/sanitize";
import { validateOrigin } from "@/lib/csrf";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, icon: true } },
      subCategory: { select: { id: true, name: true } },
      images: { orderBy: { sortOrder: "asc" } },
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          phone: true,
          createdAt: true,
        },
      },
      reviews: {
        select: {
          id: true,
          accuracyRating: true,
          communicationRating: true,
          conditionRating: true,
          content: true,
          createdAt: true,
        },
      },
      _count: {
        select: { favorites: true, chatRooms: true },
      },
    },
  });

  if (!listing || listing.status === "DELETED") {
    return NextResponse.json({ error: "매물을 찾을 수 없습니다." }, { status: 404 });
  }

  // 비활성 매물은 소유자만 조회 가능
  if (listing.status !== "ACTIVE" && listing.status !== "RESERVED" && listing.status !== "SOLD") {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.id !== listing.userId) {
      return NextResponse.json({ error: "매물을 찾을 수 없습니다." }, { status: 404 });
    }
  }

  // 조회수 증가 (atomic)
  const updated = await prisma.listing.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
    select: { viewCount: true },
  });

  // 연락처 비공개인 경우 전화번호 마스킹
  const result = {
    ...listing,
    viewCount: updated.viewCount,
    user: {
      ...listing.user,
      phone: listing.contactPublic ? listing.user.phone : null,
    },
  };

  return NextResponse.json(result);
}

// 매물 수정 (소유자만)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rl = rateLimit(ip, 10, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다." }, { status: 429 });
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;

  // 매물 소유권 확인
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { userId: true, status: true },
  });

  if (!listing) {
    return NextResponse.json({ error: "매물을 찾을 수 없습니다." }, { status: 404 });
  }

  if (listing.userId !== session.user.id) {
    return NextResponse.json(
      { error: "본인의 매물만 수정할 수 있습니다." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    // 이미지 업데이트 처리
    const updateData: Record<string, unknown> = {
      status: body.status || listing.status,
      zipCode: body.zipCode ?? null,
      addressJibun: body.addressJibun ?? null,
      addressRoad: body.addressRoad ?? null,
      addressDetail: body.addressDetail ? sanitizeInput(body.addressDetail) : null,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      categoryId: body.categoryId ?? null,
      subCategoryId: body.subCategoryId ?? null,
      deposit: body.deposit ?? 0,
      monthlyRent: body.monthlyRent ?? 0,
      premium: body.premium ?? 0,
      premiumNone: body.premiumNone ?? false,
      premiumNegotiable: body.premiumNegotiable ?? false,
      premiumBusiness: body.premiumBusiness ?? null,
      premiumBusinessDesc: body.premiumBusinessDesc ?? null,
      premiumFacility: body.premiumFacility ?? null,
      premiumFacilityDesc: body.premiumFacilityDesc ?? null,
      premiumLocation: body.premiumLocation ?? null,
      premiumLocationDesc: body.premiumLocationDesc ?? null,
      maintenanceFee: body.maintenanceFee ?? null,
      brandType: body.brandType || "PRIVATE",
      storeName: body.storeName ? sanitizeInput(body.storeName) : null,
      currentFloor: body.currentFloor ?? null,
      totalFloor: body.totalFloor ?? null,
      isBasement: body.isBasement ?? false,
      areaPyeong: body.areaPyeong ?? null,
      areaSqm: body.areaSqm ?? null,
      themes: body.themes || [],
      parkingTotal: body.parkingTotal ?? null,
      parkingPerUnit: body.parkingPerUnit ?? null,
      parkingNone: body.parkingNone ?? false,
      monthlyRevenue: body.monthlyRevenue ?? null,
      expenseMaterial: body.expenseMaterial ?? null,
      expenseLabor: body.expenseLabor ?? null,
      operationType: body.operationType || "SOLO",
      familyWorkers: body.familyWorkers ?? null,
      employeesFull: body.employeesFull ?? null,
      employeesPart: body.employeesPart ?? null,
      expenseRent: body.expenseRent ?? null,
      expenseMaintenance: body.expenseMaintenance ?? null,
      expenseUtility: body.expenseUtility ?? null,
      expenseOther: body.expenseOther ?? null,
      monthlyProfit: body.monthlyProfit ?? null,
      profitDescription: body.profitDescription ? sanitizeInput(body.profitDescription) : null,
      description: body.description ? sanitizeHtml(body.description) : null,
      contactPublic: body.contactPublic ?? false,
    };

    // 이미지가 제공된 경우 기존 이미지 삭제 후 새로 생성
    if (body.images && Array.isArray(body.images)) {
      updateData.images = {
        deleteMany: {},
        create: body.images.map(
          (img: { url: string; type: string; sortOrder: number }) => ({
            url: img.url,
            type: img.type || "OTHER",
            sortOrder: img.sortOrder || 0,
          })
        ),
      };
    }

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true, icon: true } },
        subCategory: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json(updatedListing);
  } catch (error) {
    console.error("매물 수정 오류:", error);
    return NextResponse.json(
      { error: "매물 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 매물 삭제 (소프트 삭제 - 소유자 또는 관리자만)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!validateOrigin(_req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = getClientIp(_req);
  const rl = rateLimit(ip, 10, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다." }, { status: 429 });
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;

  // 매물 조회
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { userId: true, status: true },
  });

  if (!listing) {
    return NextResponse.json({ error: "매물을 찾을 수 없습니다." }, { status: 404 });
  }

  // 소유자 또는 관리자 권한 확인
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (listing.userId !== session.user.id && user?.role !== "ADMIN") {
    return NextResponse.json(
      { error: "본인의 매물만 삭제할 수 있습니다." },
      { status: 403 }
    );
  }

  try {
    // 소프트 삭제 (status를 DELETED로 변경)
    await prisma.listing.update({
      where: { id },
      data: { status: "DELETED" },
    });

    return NextResponse.json({ success: true, message: "매물이 삭제되었습니다." });
  } catch (error) {
    console.error("매물 삭제 오류:", error);
    return NextResponse.json(
      { error: "매물 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
