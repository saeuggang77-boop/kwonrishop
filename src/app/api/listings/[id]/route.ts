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

  // listing + session 병렬 조회
  const [listing, session] = await Promise.all([
    prisma.listing.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, icon: true } },
        subCategory: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: "asc" } },
        documents: { orderBy: { createdAt: "asc" } },
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
          include: { product: { select: { id: true, name: true, price: true, features: true } } },
          take: 1,
          orderBy: { createdAt: "desc" as const },
        },
        priceHistory: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    }),
    getServerSession(authOptions),
  ]);

  if (!listing || listing.status === "DELETED") {
    return NextResponse.json({ error: "매물을 찾을 수 없습니다." }, { status: 404 });
  }

  // 비활성 매물은 소유자만 조회 가능
  if (listing.status !== "ACTIVE" && listing.status !== "RESERVED" && listing.status !== "SOLD") {
    if (!session?.user?.id || session.user.id !== listing.userId) {
      return NextResponse.json({ error: "매물을 찾을 수 없습니다." }, { status: 404 });
    }
  }

  // 조회수 증가 (fire-and-forget, 응답 차단하지 않음)
  prisma.listing.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  // favorited + regionStats 병렬 조회
  const regionPrefix = listing.addressJibun?.split(" ").slice(0, 2).join(" ");
  const [fav, regionAgg] = await Promise.all([
    session?.user?.id
      ? prisma.favorite.findUnique({
          where: { userId_listingId: { userId: session.user.id, listingId: id } },
        })
      : null,
    regionPrefix && listing.categoryId
      ? prisma.listing.aggregate({
          where: {
            categoryId: listing.categoryId,
            addressJibun: { startsWith: regionPrefix },
            status: "ACTIVE",
            id: { not: listing.id },
          },
          _avg: { viewCount: true, favoriteCount: true },
          _count: true,
        })
      : null,
  ]);
  const favorited = !!fav;

  // featuredTier 계산 (features.badge 기반, 없으면 productId/productName 폴백)
  const adProduct = listing.adPurchases?.[0]?.product;
  const productFeatures = adProduct?.features as Record<string, any> | null;
  const badge = productFeatures?.badge as string | undefined;
  let featuredTier = "FREE";
  if (badge) {
    featuredTier = badge.toUpperCase().includes("VIP") ? "VIP" : badge.toUpperCase().includes("PREMIUM") || badge.includes("프리미엄") ? "PREMIUM" : "BASIC";
  } else if (adProduct) {
    const productId = adProduct.id || "";
    featuredTier = productId.includes("vip") ? "VIP" : productId.includes("premium") ? "PREMIUM" : productId ? "BASIC" : "FREE";
  }

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
  let regionStats = null;
  if (regionAgg && regionAgg._count > 0) {
    regionStats = {
      avgViewCount: Math.round(regionAgg._avg.viewCount || 0),
      avgFavoriteCount: Math.round(regionAgg._avg.favoriteCount || 0),
      totalCount: regionAgg._count,
      region: regionPrefix,
    };
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
    viewCount: listing.viewCount + 1,
    featuredTier,
    favorited,
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

  // 매물 소유권 확인 + 방어적 업데이트를 위한 기존 전체 데이터 로드
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { images: true, documents: true },
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

    // 방어적 업데이트: body에 키가 명시적으로 존재하는 필드만 업데이트, 없으면 기존 DB 값 유지
    const updateData: Record<string, unknown> = {
      status: body.status || listing.status,
      // 주소 관련
      zipCode: "zipCode" in body ? (body.zipCode ?? null) : listing.zipCode,
      addressJibun: "addressJibun" in body ? (body.addressJibun ?? null) : listing.addressJibun,
      addressRoad: "addressRoad" in body ? (body.addressRoad ?? null) : listing.addressRoad,
      addressDetail: "addressDetail" in body ? (body.addressDetail ? sanitizeInput(body.addressDetail) : null) : listing.addressDetail,
      latitude: "latitude" in body ? (body.latitude ?? null) : listing.latitude,
      longitude: "longitude" in body ? (body.longitude ?? null) : listing.longitude,
      // 카테고리
      categoryId: "categoryId" in body ? (body.categoryId ?? null) : listing.categoryId,
      subCategoryId: "subCategoryId" in body ? (body.subCategoryId ?? null) : listing.subCategoryId,
      // 가격
      deposit: "deposit" in body ? (body.deposit ?? 0) : listing.deposit,
      monthlyRent: "monthlyRent" in body ? (body.monthlyRent ?? 0) : listing.monthlyRent,
      premium: "premium" in body ? (body.premium ?? 0) : listing.premium,
      premiumNone: "premiumNone" in body ? (body.premiumNone ?? false) : listing.premiumNone,
      premiumNegotiable: "premiumNegotiable" in body ? (body.premiumNegotiable ?? false) : listing.premiumNegotiable,
      premiumBusiness: "premiumBusiness" in body ? (body.premiumBusiness ?? null) : listing.premiumBusiness,
      premiumBusinessDesc: "premiumBusinessDesc" in body ? (body.premiumBusinessDesc ?? null) : listing.premiumBusinessDesc,
      premiumFacility: "premiumFacility" in body ? (body.premiumFacility ?? null) : listing.premiumFacility,
      premiumFacilityDesc: "premiumFacilityDesc" in body ? (body.premiumFacilityDesc ?? null) : listing.premiumFacilityDesc,
      premiumLocation: "premiumLocation" in body ? (body.premiumLocation ?? null) : listing.premiumLocation,
      premiumLocationDesc: "premiumLocationDesc" in body ? (body.premiumLocationDesc ?? null) : listing.premiumLocationDesc,
      maintenanceFee: "maintenanceFee" in body ? (body.maintenanceFee ?? null) : listing.maintenanceFee,
      // 상가 정보
      brandType: "brandType" in body ? (body.brandType || "PRIVATE") : listing.brandType,
      storeName: "storeName" in body ? (body.storeName ? sanitizeInput(body.storeName) : null) : listing.storeName,
      currentFloor: "currentFloor" in body ? (body.currentFloor ?? null) : listing.currentFloor,
      totalFloor: "totalFloor" in body ? (body.totalFloor ?? null) : listing.totalFloor,
      isBasement: "isBasement" in body ? (body.isBasement ?? false) : listing.isBasement,
      areaPyeong: "areaPyeong" in body ? (body.areaPyeong ?? null) : listing.areaPyeong,
      areaSqm: "areaSqm" in body ? (body.areaSqm ?? null) : listing.areaSqm,
      themes: "themes" in body ? (body.themes || []) : listing.themes,
      // 주차
      parkingTotal: "parkingTotal" in body ? (body.parkingTotal ?? null) : listing.parkingTotal,
      parkingPerUnit: "parkingPerUnit" in body ? (body.parkingPerUnit ?? null) : listing.parkingPerUnit,
      parkingNone: "parkingNone" in body ? (body.parkingNone ?? false) : listing.parkingNone,
      // 매출/비용
      monthlyRevenue: "monthlyRevenue" in body ? (body.monthlyRevenue ?? null) : listing.monthlyRevenue,
      expenseMaterial: "expenseMaterial" in body ? (body.expenseMaterial ?? null) : listing.expenseMaterial,
      expenseLabor: "expenseLabor" in body ? (body.expenseLabor ?? null) : listing.expenseLabor,
      operationType: "operationType" in body ? (body.operationType || "SOLO") : listing.operationType,
      familyWorkers: "familyWorkers" in body ? (body.familyWorkers ?? null) : listing.familyWorkers,
      employeesFull: "employeesFull" in body ? (body.employeesFull ?? null) : listing.employeesFull,
      employeesPart: "employeesPart" in body ? (body.employeesPart ?? null) : listing.employeesPart,
      expenseRent: "expenseRent" in body ? (body.expenseRent ?? null) : listing.expenseRent,
      expenseMaintenance: "expenseMaintenance" in body ? (body.expenseMaintenance ?? null) : listing.expenseMaintenance,
      expenseUtility: "expenseUtility" in body ? (body.expenseUtility ?? null) : listing.expenseUtility,
      expenseOther: "expenseOther" in body ? (body.expenseOther ?? null) : listing.expenseOther,
      monthlyProfit: "monthlyProfit" in body ? (body.monthlyProfit ?? null) : listing.monthlyProfit,
      profitDescription: "profitDescription" in body ? (body.profitDescription ? sanitizeInput(body.profitDescription) : null) : listing.profitDescription,
      // 기타
      description: "description" in body ? (body.description ? sanitizeHtml(body.description) : null) : listing.description,
      contactPublic: "contactPublic" in body ? (body.contactPublic ?? false) : listing.contactPublic,
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

    // 문서가 제공된 경우 기존 문서 삭제 후 새로 생성
    if (body.documents && Array.isArray(body.documents)) {
      updateData.documents = {
        deleteMany: {},
        create: body.documents.map(
          (doc: { url: string; type?: string }) => ({
            url: doc.url,
            type: doc.type || "REVENUE_PROOF",
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
        documents: { orderBy: { createdAt: "asc" } },
      },
    });

    // 가격 변동 감지 → 찜한 사용자에게 알림 (non-blocking)
    const priceFields = [
      { name: "보증금", old: listing.deposit, new: "deposit" in body ? (body.deposit ?? 0) : listing.deposit },
      { name: "월세", old: listing.monthlyRent, new: "monthlyRent" in body ? (body.monthlyRent ?? 0) : listing.monthlyRent },
      { name: "권리금", old: listing.premium, new: "premium" in body ? (body.premium ?? 0) : listing.premium },
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
