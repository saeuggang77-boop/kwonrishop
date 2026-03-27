import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 결제 내역 조회
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const [payments, total] = await Promise.all([
      prisma.adPurchase.findMany({
        where: { userId: session.user.id },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              type: true,
              price: true,
              duration: true,
            },
          },
          listing: {
            select: {
              id: true,
              storeName: true,
              addressRoad: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.adPurchase.count({
        where: { userId: session.user.id },
      }),
    ]);

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("결제 내역 조회 오류:", error);
    return NextResponse.json(
      { error: "결제 내역 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 결제 요청 (Toss Payments 초기화)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { productId, listingId, partnerServiceId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "상품 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 상품 조회 (categoryScope 포함)
    const product = await prisma.adProduct.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        price: true,
        active: true,
        duration: true,
        categoryScope: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "상품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (!product.active) {
      return NextResponse.json(
        { error: "현재 구매할 수 없는 상품입니다." },
        { status: 400 }
      );
    }

    // 역할-카테고리 스코프 검증
    const userRole = session.user.role;
    const scope = product.categoryScope;

    if (scope === "LISTING") {
      if (userRole !== "SELLER" && userRole !== "ADMIN") {
        return NextResponse.json(
          { error: "매도자만 매물 광고 상품을 구매할 수 있습니다." },
          { status: 403 }
        );
      }
      if (!listingId) {
        return NextResponse.json(
          { error: "매물 ID가 필요합니다." },
          { status: 400 }
        );
      }
    } else if (scope === "FRANCHISE") {
      if (userRole !== "FRANCHISE" && userRole !== "ADMIN") {
        return NextResponse.json(
          { error: "프랜차이즈 본사만 프랜차이즈 상품을 구매할 수 있습니다." },
          { status: 403 }
        );
      }
    } else if (scope === "PARTNER") {
      if (userRole !== "PARTNER" && userRole !== "ADMIN") {
        return NextResponse.json(
          { error: "협력업체만 협력업체 상품을 구매할 수 있습니다." },
          { status: 403 }
        );
      }
    }
    // COMMON: 모든 인증 사용자 가능

    // 매물 ID가 제공된 경우 소유권 확인
    if (listingId) {
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { userId: true },
      });

      if (!listing) {
        return NextResponse.json(
          { error: "매물을 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      if (listing.userId !== session.user.id) {
        return NextResponse.json(
          { error: "본인의 매물만 광고를 구매할 수 있습니다." },
          { status: 403 }
        );
      }
    }

    // 협력업체 서비스 ID가 제공된 경우 소유권 확인
    if (partnerServiceId) {
      const partnerService = await prisma.partnerService.findUnique({
        where: { id: partnerServiceId },
        select: { userId: true },
      });

      if (!partnerService) {
        return NextResponse.json(
          { error: "협력업체 서비스를 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      if (partnerService.userId !== session.user.id) {
        return NextResponse.json(
          { error: "본인의 협력업체 서비스만 광고를 구매할 수 있습니다." },
          { status: 403 }
        );
      }
    }

    // AdPurchase 생성 (PENDING 상태)
    const adPurchase = await prisma.adPurchase.create({
      data: {
        userId: session.user.id,
        productId,
        listingId: listingId || null,
        partnerServiceId: partnerServiceId || null,
        status: "PENDING",
        amount: product.price,
      },
    });

    // Toss Payments에 전달할 결제 정보 반환
    return NextResponse.json({
      orderId: adPurchase.id,
      amount: product.price,
      orderName: product.name,
      productName: product.name,
      duration: product.duration,
    }, { status: 201 });
  } catch (error) {
    console.error("결제 요청 오류:", error);
    return NextResponse.json(
      { error: "결제 요청 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
