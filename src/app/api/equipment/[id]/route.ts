import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml, sanitizeInput } from "@/lib/sanitize";
import { validateOrigin } from "@/lib/csrf";
import { rateLimitRequest } from "@/lib/rate-limit";

// 집기 상세 조회
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const equipment = await prisma.equipment.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
          businessVerification: {
            select: { verified: true },
          },
        },
      },
    },
  });

  if (!equipment || equipment.status === "DELETED") {
    return NextResponse.json({ error: "집기를 찾을 수 없습니다." }, { status: 404 });
  }

  // 세션 확인 (선택적 - 조회수 스킵 및 비활성 집기 접근 제어용)
  const session = await getServerSession(authOptions);

  // 비활성 집기는 소유자만 조회 가능
  if (equipment.status !== "ACTIVE" && equipment.status !== "SOLD") {
    if (!session?.user?.id || session.user.id !== equipment.userId) {
      return NextResponse.json({ error: "집기를 찾을 수 없습니다." }, { status: 404 });
    }
  }

  // 조회수 증가 (소유자 본인 조회 제외)
  let viewCount = equipment.viewCount;
  if (!session?.user?.id || session.user.id !== equipment.userId) {
    const updated = await prisma.equipment.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });
    viewCount = updated.viewCount;
  }

  // Check if current user has favorited
  let favorited = false;
  if (session?.user?.id) {
    const fav = await prisma.equipmentFavorite.findUnique({
      where: {
        userId_equipmentId: {
          userId: session.user.id,
          equipmentId: id,
        },
      },
    });
    favorited = !!fav;
  }

  return NextResponse.json({
    ...equipment,
    viewCount,
    favorited,
  });
}

// 집기 수정 (소유자 또는 관리자만)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const rl = rateLimitRequest(req, 10, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다." }, { status: 429 });
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;

  const equipment = await prisma.equipment.findUnique({
    where: { id },
    select: { userId: true, status: true },
  });

  if (!equipment) {
    return NextResponse.json({ error: "집기를 찾을 수 없습니다." }, { status: 404 });
  }

  // 소유자 또는 관리자 확인
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (equipment.userId !== session.user.id && user?.role !== "ADMIN") {
    return NextResponse.json(
      { error: "본인의 집기만 수정할 수 있습니다." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    // Validate status - only ADMIN can set any status; users limited to allowed values
    const allowedUserStatuses = ["ACTIVE", "RESERVED", "SOLD"];
    let newStatus = equipment.status;
    if (body.status) {
      if (user?.role === "ADMIN") {
        newStatus = body.status;
      } else if (allowedUserStatuses.includes(body.status)) {
        newStatus = body.status;
      } else {
        return NextResponse.json(
          { error: "허용되지 않는 상태값입니다." },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {
      status: newStatus,
      title: body.title ? sanitizeInput(body.title) : undefined,
      description: body.description ? sanitizeHtml(body.description) : undefined,
      category: body.category || undefined,
      condition: body.condition || undefined,
      price: body.price !== undefined ? body.price : undefined,
      negotiable: body.negotiable !== undefined ? body.negotiable : undefined,
      tradeMethod: body.tradeMethod || undefined,
      addressRoad: body.addressRoad !== undefined ? (body.addressRoad ? sanitizeInput(body.addressRoad) : null) : undefined,
      addressJibun: body.addressJibun !== undefined ? (body.addressJibun ? sanitizeInput(body.addressJibun) : null) : undefined,
      addressDetail: body.addressDetail !== undefined ? (body.addressDetail ? sanitizeInput(body.addressDetail) : null) : undefined,
      latitude: body.latitude !== undefined ? body.latitude : undefined,
      longitude: body.longitude !== undefined ? body.longitude : undefined,
      brand: body.brand !== undefined ? (body.brand ? sanitizeInput(body.brand) : null) : undefined,
      modelName: body.modelName !== undefined ? (body.modelName ? sanitizeInput(body.modelName) : null) : undefined,
      purchaseYear: body.purchaseYear !== undefined ? body.purchaseYear : undefined,
      quantity: body.quantity !== undefined ? body.quantity : undefined,
    };

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    // 이미지가 제공된 경우 기존 이미지 삭제 후 새로 생성
    if (body.images && Array.isArray(body.images)) {
      updateData.images = {
        deleteMany: {},
        create: body.images.map(
          (img: { url: string; sortOrder?: number }) => ({
            url: img.url,
            sortOrder: img.sortOrder || 0,
          })
        ),
      };
    }

    const updatedEquipment = await prisma.equipment.update({
      where: { id },
      data: updateData,
      include: {
        images: { orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json(updatedEquipment);
  } catch (error) {
    console.error("집기 수정 오류:", error);
    return NextResponse.json(
      { error: "집기 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 집기 삭제 (소프트 삭제 - 소유자 또는 관리자만)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!validateOrigin(_req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const rl = rateLimitRequest(_req, 10, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다." }, { status: 429 });
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;

  const equipment = await prisma.equipment.findUnique({
    where: { id },
    select: { userId: true, status: true },
  });

  if (!equipment) {
    return NextResponse.json({ error: "집기를 찾을 수 없습니다." }, { status: 404 });
  }

  // 소유자 또는 관리자 권한 확인
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (equipment.userId !== session.user.id && user?.role !== "ADMIN") {
    return NextResponse.json(
      { error: "본인의 집기만 삭제할 수 있습니다." },
      { status: 403 }
    );
  }

  try {
    await prisma.equipment.update({
      where: { id },
      data: { status: "DELETED" },
    });

    return NextResponse.json({ success: true, message: "집기가 삭제되었습니다." });
  } catch (error) {
    console.error("집기 삭제 오류:", error);
    return NextResponse.json(
      { error: "집기 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
