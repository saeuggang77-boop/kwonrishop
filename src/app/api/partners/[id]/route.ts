import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml, sanitizeInput } from "@/lib/sanitize";
import { validateOrigin } from "@/lib/csrf";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// 협력업체 단일 조회
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const partner = await prisma.partnerService.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  if (!partner || partner.status === "DELETED") {
    return NextResponse.json({ error: "협력업체를 찾을 수 없습니다." }, { status: 404 });
  }

  // 비활성 업체는 소유자만 조회 가능
  if (partner.status !== "ACTIVE") {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.id !== partner.userId) {
      return NextResponse.json({ error: "협력업체를 찾을 수 없습니다." }, { status: 404 });
    }
  }

  // 조회수 증가 (atomic)
  const updated = await prisma.partnerService.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
    select: { viewCount: true },
  });

  return NextResponse.json({
    ...partner,
    viewCount: updated.viewCount,
  });
}

// 협력업체 수정 (소유자만)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

  // 소유권 확인
  const partner = await prisma.partnerService.findUnique({
    where: { id },
    select: { userId: true, status: true },
  });

  if (!partner) {
    return NextResponse.json({ error: "협력업체를 찾을 수 없습니다." }, { status: 404 });
  }

  if (partner.userId !== session.user.id) {
    return NextResponse.json(
      { error: "본인의 업체만 수정할 수 있습니다." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    const updateData: Record<string, unknown> = {
      companyName: sanitizeInput(body.companyName),
      serviceType: body.serviceType,
      description: body.description ? sanitizeHtml(body.description) : null,
      contactPhone: body.contactPhone ? sanitizeInput(body.contactPhone) : null,
      contactEmail: body.contactEmail ? sanitizeInput(body.contactEmail) : null,
      website: body.website ? sanitizeInput(body.website) : null,
      addressRoad: body.addressRoad ? sanitizeInput(body.addressRoad) : null,
      addressJibun: body.addressJibun ? sanitizeInput(body.addressJibun) : null,
      addressDetail: body.addressDetail ? sanitizeInput(body.addressDetail) : null,
      latitude: body.latitude || null,
      longitude: body.longitude || null,
      serviceArea: body.serviceArea || [],
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

    const updatedPartner = await prisma.partnerService.update({
      where: { id },
      data: updateData,
      include: {
        images: { orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json(updatedPartner);
  } catch (error) {
    console.error("협력업체 수정 오류:", error);
    return NextResponse.json(
      { error: "협력업체 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 협력업체 삭제 (소프트 삭제 - 소유자 또는 관리자만)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

  // 업체 조회
  const partner = await prisma.partnerService.findUnique({
    where: { id },
    select: { userId: true, status: true },
  });

  if (!partner) {
    return NextResponse.json({ error: "협력업체를 찾을 수 없습니다." }, { status: 404 });
  }

  // 소유자 또는 관리자 권한 확인
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (partner.userId !== session.user.id && user?.role !== "ADMIN") {
    return NextResponse.json(
      { error: "본인의 업체만 삭제할 수 있습니다." },
      { status: 403 }
    );
  }

  try {
    // 소프트 삭제 (status를 DELETED로 변경)
    await prisma.partnerService.update({
      where: { id },
      data: { status: "DELETED" },
    });

    return NextResponse.json({ success: true, message: "협력업체가 삭제되었습니다." });
  } catch (error) {
    console.error("협력업체 삭제 오류:", error);
    return NextResponse.json(
      { error: "협력업체 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
