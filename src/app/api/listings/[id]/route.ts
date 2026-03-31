import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml, sanitizeInput } from "@/lib/sanitize";
import { validateOrigin } from "@/lib/csrf";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendPushToUser } from "@/lib/push";

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
          businessVerification: {
            select: { verified: true },
          },
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
      adPurchases: {
        where: {
          status: "PAID",
          expiresAt: { gt: new Date() },
        },
        include: { product: { select: { id: true, name: true, price: true } } },
        take: 1,
        orderBy: { createdAt: "desc" as const },
      },
      priceHistory: {
        orderBy: { createdAt: "desc" },
        take: 20,
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

  // featuredTier 계산 (product.name 기반: "VIP", "프리미엄", "베이직" 등)
  const productName = listing.adPurchases?.[0]?.product?.name || "";
  const featuredTier = productName.includes("VIP") ? "VIP" : productName.includes("프리미엄") ? "PREMIUM" : productName ? "BASIC" : "FREE";

  // 판매자 신뢰도 점수 계산 (리뷰 기반)
  const reviewCount = listing.reviews.length;
  let sellerTrust = { avgRating: 0, reviewCount: 0 };
  if (reviewCount > 0) {
    const totalRating = listing.reviews.reduce((sum, r) => {
      return sum + (r.accuracyRating + r.communicationRating + r.conditionRating) / 3;
    }, 0);
    sellerTrust = {
      avgRating: Number((totalRating / reviewCount).toFixed(1)),
      reviewCount,
    };
  }

  // 지역 평균 대비 성과 (같은 지역+업종, 소유자에게만 노출)
  const regionPrefix = listing.addressJibun?.split(" ").slice(0, 2).join(" ");
  let regionStats = null;
  if (regionPrefix && listing.categoryId) {
    const stats = await prisma.listing.aggregate({
      where: {
        categoryId: listing.categoryId,
        addressJibun: { startsWith: regionPrefix },
        status: "ACTIVE",
        id: { not: listing.id },
      },
      _avg: { viewCount: true, favoriteCount: true },
      _count: true,
    });
    if (stats._count > 0) {
      regionStats = {
        avgViewCount: Math.round(stats._avg.viewCount || 0),
        avgFavoriteCount: Math.round(stats._avg.favoriteCount || 0),
        totalCount: stats._count,
        region: regionPrefix,
      };
    }
  }

  // 연락처 비공개인 경우 전화번호 제거 (spread 오버라이드 방지를 위해 명시적 재구성)
  const safeUser = {
    id: listing.user.id,
    name: listing.user.name,
    image: listing.user.image,
    phone: listing.contactPublic ? listing.user.phone : null,
    createdAt: listing.user.createdAt,
    businessVerified: listing.user.businessVerification?.verified ?? false,
  };

  const result = {
    ...listing,
    viewCount: updated.viewCount,
    featuredTier,
    sellerTrust,
    regionStats,
    adPurchases: undefined,
    reviews: undefined,
    user: safeUser,
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

  // 매물 소유권 확인 + 가격 변동 감지용 기존값 조회
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { userId: true, status: true, deposit: true, monthlyRent: true, premium: true, storeName: true, addressRoad: true },
  });

  if (!listing) {
    return NextResponse.json({ error: "매물을 찾을 수 없습니다." }, { status: 404 });
  }

  // 소유자 또는 관리자 권한 확인
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (listing.userId !== session.user.id && currentUser?.role !== "ADMIN") {
    return NextResponse.json(
      { error: "본인의 매물만 수정할 수 있습니다." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    // 상태 전환 검증 (state machine)
    const VALID_TRANSITIONS: Record<string, string[]> = {
      ACTIVE: ["RESERVED", "SOLD"],
      RESERVED: ["ACTIVE", "SOLD"],
      SOLD: [],  // 거래완료는 되돌리기 불가
      EXPIRED: ["ACTIVE"],  // 만료된 매물만 재활성화 가능
      DELETED: [],  // 삭제된 매물은 복원 불가
    };

    if (body.status && body.status !== listing.status) {
      const allowed = VALID_TRANSITIONS[listing.status] || [];
      if (!allowed.includes(body.status)) {
        return NextResponse.json(
          { error: `${listing.status} 상태에서 ${body.status}(으)로 변경할 수 없습니다.` },
          { status: 400 }
        );
      }
    }

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

    // 가격 변동 감지 → 찜한 사용자에게 알림 (non-blocking)
    const priceFields = [
      { name: "보증금", old: listing.deposit, new: body.deposit ?? 0 },
      { name: "월세", old: listing.monthlyRent, new: body.monthlyRent ?? 0 },
      { name: "권리금", old: listing.premium, new: body.premium ?? 0 },
    ];
    const changes = priceFields.filter((f) => f.old !== f.new && (f.old > 0 || f.new > 0));

    if (changes.length > 0) {
      // 가격 변동 이력 저장 (실패해도 매물 수정 결과에 영향 없도록 격리)
      try {
        await prisma.priceHistory.createMany({
          data: changes.map(c => ({
            listingId: id,
            field: c.name === "보증금" ? "deposit" : c.name === "월세" ? "monthlyRent" : "premium",
            oldValue: c.old,
            newValue: c.new,
          })),
        });
      } catch (historyErr) {
        console.error("[PriceHistory] 이력 저장 실패:", historyErr);
      }

      (async () => {
        try {
          // 24시간 내 동일 매물 가격변동 알림이 이미 있으면 스킵 (SMS 폭탄 방지)
          const recentNotification = await prisma.notification.findFirst({
            where: {
              type: "PRICE_CHANGE",
              link: `/listings/${id}`,
              createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
          });
          if (recentNotification) return;

          const favoriteUsers = await prisma.favorite.findMany({
            where: { listingId: id },
            include: { user: { select: { id: true, phone: true } } },
          });

          if (favoriteUsers.length === 0) return;

          const storeName = listing.storeName || listing.addressRoad || "매물";
          const changeText = changes.map((c) => `${c.name}: ${c.old.toLocaleString()}→${c.new.toLocaleString()}만원`).join(", ");

          await prisma.notification.createMany({
            data: favoriteUsers.map((fav) => ({
              userId: fav.user.id,
              type: "PRICE_CHANGE",
              title: `${storeName} 가격 변동`,
              message: changeText,
              link: `/listings/${id}`,
            })),
          });

          for (const fav of favoriteUsers) {
            // 웹 푸시 (non-blocking)
            sendPushToUser(
              fav.user.id,
              `${storeName} 가격 변동`,
              changeText,
              `/listings/${id}`
            ).catch(() => {});
          }
        } catch (err) {
          console.error("[PriceChange] 알림 발송 실패:", err);
        }
      })();
    }

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
