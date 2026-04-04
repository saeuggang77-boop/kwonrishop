import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateOrigin } from "@/lib/csrf";
import { rateLimitRequest } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const total = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        listing: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform to include listingCount (0 or 1 since it's 1:1)
    const transformedUsers = users.map((u) => ({
      ...u,
      listingCount: u.listing ? 1 : 0,
      listing: undefined,
    }));

    return NextResponse.json({
      users: transformedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// 회원 제재
export async function PATCH(req: NextRequest) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const rl = rateLimitRequest(req, 10, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다." }, { status: 429 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { targetUserId, action, reason } = body;

    if (!targetUserId || !action) {
      return NextResponse.json({ error: "targetUserId와 action은 필수입니다." }, { status: 400 });
    }

    // 제재 대상 확인
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true, email: true, name: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    if (targetUser.role === "ADMIN") {
      return NextResponse.json({ error: "관리자는 제재할 수 없습니다." }, { status: 400 });
    }

    if (action === "ban") {
      // 사업자번호 조회
      const bv = await prisma.businessVerification.findUnique({
        where: { userId: targetUserId },
        select: { businessNumber: true },
      });

      await prisma.$transaction(async (tx) => {
        // 사업자번호 블랙리스트 등록
        if (bv) {
          await tx.blacklistedBusiness.upsert({
            where: { businessNumber: bv.businessNumber },
            update: {
              type: "BANNED",
              reason: reason || "관리자 제재",
              blockedBy: session.user.id,
              expiresAt: null,
            },
            create: {
              businessNumber: bv.businessNumber,
              type: "BANNED",
              reason: reason || "관리자 제재",
              blockedBy: session.user.id,
            },
          });
        }

        // 매물/집기/협력업체 비활성화
        await tx.listing.updateMany({
          where: { userId: targetUserId, status: { in: ["ACTIVE", "DRAFT"] } },
          data: { status: "DELETED" },
        });
        await tx.equipment.updateMany({
          where: { userId: targetUserId, status: "ACTIVE" },
          data: { status: "DELETED" },
        });
        await tx.partnerService.updateMany({
          where: { userId: targetUserId, status: "ACTIVE" },
          data: { status: "DELETED" },
        });

        // 사업자인증 삭제
        await tx.businessVerification.deleteMany({ where: { userId: targetUserId } });

        // 프랜차이즈 관리자 해제
        await tx.franchiseBrand.updateMany({
          where: { managerId: targetUserId },
          data: { managerId: null },
        });

        // 세션 무효화
        await tx.session.deleteMany({ where: { userId: targetUserId } });
        await tx.account.deleteMany({ where: { userId: targetUserId } });

        // 유저 익명화
        await tx.user.update({
          where: { id: targetUserId },
          data: {
            email: `banned_${targetUserId}@banned.local`,
            name: "제재회원",
            phone: null,
            image: null,
            password: null,
            pendingRole: null,
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: `${targetUser.name || targetUser.email} 회원이 제재되었습니다.`,
        blacklisted: !!bv,
      });
    }

    if (action === "unban_business") {
      // 블랙리스트 해제 (사업자번호 기준)
      const { businessNumber } = body;
      if (!businessNumber) {
        return NextResponse.json({ error: "businessNumber는 필수입니다." }, { status: 400 });
      }
      await prisma.blacklistedBusiness.deleteMany({
        where: { businessNumber: businessNumber.replace(/-/g, "") },
      });
      return NextResponse.json({ success: true, message: "블랙리스트가 해제되었습니다." });
    }

    return NextResponse.json({ error: "지원하지 않는 action입니다." }, { status: 400 });
  } catch (error) {
    console.error("회원 제재 오류:", error);
    return NextResponse.json({ error: "제재 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
