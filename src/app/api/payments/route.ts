import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateOrigin } from "@/lib/csrf";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// 결제 내역 조회
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

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
          equipment: {
            select: {
              id: true,
              title: true,
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
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rl = rateLimit(ip, 5, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다." }, { status: 429 });
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const body = await req.json();
    let { productId, listingId, partnerServiceId, equipmentId } = body;

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
      // listingId가 없으면 사용자의 활성 매물 자동 탐지 (1인 1매물)
      if (!listingId) {
        const userListing = await prisma.listing.findFirst({
          where: {
            userId: session.user.id,
            status: "ACTIVE",
          },
          select: { id: true },
        });

        if (!userListing) {
          return NextResponse.json(
            { error: "활성 매물이 없습니다. 먼저 매물을 등록해주세요." },
            { status: 400 }
          );
        }

        listingId = userListing.id;
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
      // partnerServiceId가 없으면 사용자의 활성 협력업체 서비스 자동 탐지
      if (!partnerServiceId) {
        const myService = await prisma.partnerService.findFirst({
          where: {
            userId: session.user.id,
            status: "ACTIVE",
          },
          select: { id: true },
        });

        if (!myService) {
          return NextResponse.json(
            { error: "활성 협력업체 서비스가 없습니다. 먼저 서비스를 등록해주세요." },
            { status: 400 }
          );
        }

        partnerServiceId = myService.id;
      }
    } else if (scope === "EQUIPMENT") {
      if (userRole !== "SELLER" && userRole !== "FRANCHISE" && userRole !== "PARTNER" && userRole !== "ADMIN") {
        return NextResponse.json(
          { error: "사업자만 집기장터 상품을 구매할 수 있습니다." },
          { status: 403 }
        );
      }
      if (!equipmentId) {
        return NextResponse.json(
          { error: "집기 ID가 필요합니다." },
          { status: 400 }
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

    // 집기 ID가 제공된 경우 소유권 확인
    if (equipmentId) {
      const equipment = await prisma.equipment.findUnique({
        where: { id: equipmentId },
        select: { userId: true },
      });

      if (!equipment) {
        return NextResponse.json(
          { error: "집기 매물을 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      if (equipment.userId !== session.user.id) {
        return NextResponse.json(
          { error: "본인의 집기 매물만 광고를 구매할 수 있습니다." },
          { status: 403 }
        );
      }
    }

    // VAT 10% 적용 (10원 단위 반올림)
    const supplyPrice = product.price;
    const vatAmount = Math.round(supplyPrice * 0.1 / 10) * 10;
    const totalAmount = supplyPrice + vatAmount;

    // AdPurchase 생성 (PENDING 상태, 공급가액 저장)
    const adPurchase = await prisma.adPurchase.create({
      data: {
        userId: session.user.id,
        productId,
        listingId: listingId || null,
        partnerServiceId: partnerServiceId || null,
        equipmentId: equipmentId || null,
        status: "PENDING",
        amount: supplyPrice,
      },
    });

    // Toss Payments에 전달할 결제 정보 반환 (VAT 포함 금액)
    return NextResponse.json({
      orderId: adPurchase.id,
      amount: totalAmount,
      supplyPrice,
      vatAmount,
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
