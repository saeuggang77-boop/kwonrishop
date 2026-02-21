import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { searchListingsSchema, createListingSchema } from "@/lib/validators/listing";
import { errorToResponse } from "@/lib/utils/errors";
import { m2ToPyeong } from "@/lib/utils/area";
import { fraudDetectionQueue, imageProcessingQueue } from "@/lib/queue";
import { S3_BUCKET_UPLOADS } from "@/lib/s3/client";
import { getExposureBatch, assignExposureOrder } from "@/lib/utils/rotation-queue";

function getSessionId(req: Request): string {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const tokenMatch = cookieHeader.match(/(?:__Secure-)?next-auth\.session-token=([^;]+)/);
  if (tokenMatch?.[1]) {
    return createHash("sha256").update(tokenMatch[1]).digest("hex").slice(0, 16);
  }
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0].trim() || "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

/** 프론트엔드 짧은 도시명 → DB 정식명 매핑 */
const CITY_FULL_NAMES: Record<string, string> = {
  "서울": "서울특별시",
  "경기": "경기도",
  "인천": "인천광역시",
  "부산": "부산광역시",
  "대구": "대구광역시",
  "대전": "대전광역시",
  "광주": "광주광역시",
  "울산": "울산광역시",
  "세종": "세종특별자치시",
  "강원": "강원특별자치도",
  "충북": "충청북도",
  "충남": "충청남도",
  "전북": "전북특별자치도",
  "전남": "전라남도",
  "경북": "경상북도",
  "경남": "경상남도",
  "제주": "제주특별자치도",
};

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const parsed = searchListingsSchema.parse(params);
    const sort = req.nextUrl.searchParams.get("sort") ?? "rotation";

    const where: Record<string, unknown> = {
      status: "ACTIVE",
    };

    if (parsed.query) {
      where.OR = [
        { title: { contains: parsed.query, mode: "insensitive" } },
        { description: { contains: parsed.query, mode: "insensitive" } },
        { address: { contains: parsed.query, mode: "insensitive" } },
      ];
    }
    if (parsed.businessCategory) where.businessCategory = parsed.businessCategory;
    if (parsed.businessSubtype) where.businessSubtype = parsed.businessSubtype;
    if (parsed.storeType) where.storeType = parsed.storeType;
    if (parsed.city) where.city = CITY_FULL_NAMES[parsed.city] ?? parsed.city;
    if (parsed.district) where.district = parsed.district;
    if (parsed.priceMin || parsed.priceMax) {
      where.price = {};
      if (parsed.priceMin) (where.price as Record<string, unknown>).gte = BigInt(parsed.priceMin);
      if (parsed.priceMax) (where.price as Record<string, unknown>).lte = BigInt(parsed.priceMax);
    }
    if (parsed.premiumFeeMin !== undefined || parsed.premiumFeeMax !== undefined) {
      if (parsed.premiumFeeMax === 0) {
        // 무권리: premiumFee is null or 0
        if (!where.AND) where.AND = [];
        (where.AND as unknown[]).push({
          OR: [{ premiumFee: null }, { premiumFee: BigInt(0) }],
        });
      } else {
        where.premiumFee = {};
        if (parsed.premiumFeeMin !== undefined) (where.premiumFee as Record<string, unknown>).gte = BigInt(parsed.premiumFeeMin);
        if (parsed.premiumFeeMax !== undefined) (where.premiumFee as Record<string, unknown>).lte = BigInt(parsed.premiumFeeMax);
      }
    }
    if (parsed.totalCostMin !== undefined || parsed.totalCostMax !== undefined) {
      const conditions: string[] = ['"status" = \'ACTIVE\''];
      const params: unknown[] = [];
      let idx = 1;
      if (parsed.totalCostMin !== undefined) {
        conditions.push(`("price" + COALESCE("premiumFee", 0)) >= $${idx}`);
        params.push(BigInt(parsed.totalCostMin));
        idx++;
      }
      if (parsed.totalCostMax !== undefined) {
        conditions.push(`("price" + COALESCE("premiumFee", 0)) <= $${idx}`);
        params.push(BigInt(parsed.totalCostMax));
        idx++;
      }
      const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT "id" FROM "Listing" WHERE ${conditions.join(" AND ")}`,
        ...params,
      );
      if (!where.AND) where.AND = [];
      (where.AND as unknown[]).push({ id: { in: rows.map((r) => r.id) } });
    }
    if (parsed.monthlyProfitMin !== undefined || parsed.monthlyProfitMax !== undefined) {
      where.monthlyProfit = {};
      if (parsed.monthlyProfitMin !== undefined) (where.monthlyProfit as Record<string, unknown>).gte = BigInt(parsed.monthlyProfitMin);
      if (parsed.monthlyProfitMax !== undefined) (where.monthlyProfit as Record<string, unknown>).lte = BigInt(parsed.monthlyProfitMax);
    }
    if (parsed.premiumOnly) {
      where.isPremium = true;
    }
    if (parsed.trustedOnly) {
      where.seller = { isTrustedSeller: true };
    }
    if (parsed.diagnosisOnly) {
      where.hasDiagnosisBadge = true;
    }
    if (parsed.floor != null) {
      where.floor = parsed.floor;
    }
    if (parsed.areaMin != null || parsed.areaMax != null) {
      where.areaPyeong = {};
      if (parsed.areaMin != null) (where.areaPyeong as Record<string, unknown>).gte = parsed.areaMin;
      if (parsed.areaMax != null) (where.areaPyeong as Record<string, unknown>).lte = parsed.areaMax;
    }
    if (parsed.safetyGrade) {
      where.safetyGrade = parsed.safetyGrade;
    }
    if (parsed.swLat != null && parsed.swLng != null && parsed.neLat != null && parsed.neLng != null) {
      where.latitude = { gte: parsed.swLat, lte: parsed.neLat };
      where.longitude = { gte: parsed.swLng, lte: parsed.neLng };
    }

    const urgentOnly = req.nextUrl.searchParams.get("urgentOnly") === "true";

    // ── Rotation mode ──
    if (sort === "rotation") {
      const sessionId = getSessionId(req);
      const cursor = parsed.cursor;

      // Total count for pagination info
      const totalCount = await prisma.listing.count({ where: { status: "ACTIVE", ...where } });

      let premiumTop: unknown[] = [];
      let recommended: unknown[] = [];
      let listings: unknown[] = [];
      let nextCursor: string | null = null;

      // Detect if any filter is active
      const hasFilters = Boolean(
        parsed.query || parsed.businessCategory || parsed.businessSubtype ||
        parsed.storeType || parsed.city || parsed.district ||
        parsed.priceMin || parsed.priceMax || parsed.premiumFeeMin || parsed.premiumFeeMax ||
        parsed.totalCostMin || parsed.totalCostMax || parsed.monthlyProfitMin || parsed.monthlyProfitMax ||
        parsed.premiumOnly || parsed.trustedOnly || parsed.diagnosisOnly ||
        parsed.floor != null || parsed.areaMin != null || parsed.areaMax != null ||
        parsed.safetyGrade || urgentOnly
      );

      if (!cursor) {
        // First page: get premiumTop, recommended only when NO filters active
        if (!hasFilters) {
          const premiumResult = await getExposureBatch("premium", 2, sessionId);
          const recommendResult = await getExposureBatch("recommend", 2, sessionId);
          premiumTop = premiumResult.listings;
          recommended = recommendResult.listings;
        }

        // Direct DB query with all user filters + rotation ordering
        const rotationSelect = {
          id: true, title: true, businessCategory: true, storeType: true,
          price: true, monthlyRent: true, managementFee: true, premiumFee: true,
          monthlyRevenue: true, monthlyProfit: true, areaPyeong: true, floor: true,
          city: true, district: true, neighborhood: true, latitude: true, longitude: true,
          safetyGrade: true, isPremium: true, isRecommended: true, premiumRank: true,
          hasDiagnosisBadge: true, viewCount: true, listingExposureOrder: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true, thumbnailUrl: true } },
          seller: { select: { name: true, image: true, isTrustedSeller: true } },
        };

        const allListings = await prisma.listing.findMany({
          where,
          select: rotationSelect,
          orderBy: { listingExposureOrder: "asc" },
          take: 21,
        });

        listings = allListings.slice(0, 20);
        if (allListings.length > 20) {
          const lastListing = listings[listings.length - 1] as Record<string, unknown>;
          nextCursor = `${lastListing.listingExposureOrder}_${Date.now()}`;
        }

        // 일반 매물 큐 로테이션 (프리미엄/추천과 동일 로직)
        // 노출된 매물의 listingExposureOrder = MAX+1부터 재할당 → 큐 뒤로 이동
        if (!hasFilters && listings.length > 0) {
          const listingCooldownKey = `rotation:listing:${sessionId}`;
          let shouldRotateListings = false;
          try {
            const { getRedis } = await import("@/lib/redis/client");
            const redis = getRedis();
            const result = await Promise.race([
              redis.set(listingCooldownKey, "1", "EX", 300, "NX"),
              new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error("Redis timeout")), 2000),
              ),
            ]);
            shouldRotateListings = result === "OK";
          } catch {
            shouldRotateListings = true;
          }

          if (shouldRotateListings) {
            try {
              const maxResult = await prisma.listing.aggregate({
                where: { status: "ACTIVE" },
                _max: { listingExposureOrder: true },
              });
              const maxOrder = maxResult._max.listingExposureOrder ?? 0;
              await prisma.$transaction(
                (listings as Array<Record<string, unknown>>).map((l, idx) =>
                  prisma.listing.update({
                    where: { id: l.id as string },
                    data: { listingExposureOrder: maxOrder + idx + 1 },
                  }),
                ),
              );
            } catch {
              // 로테이션 실패해도 조회 결과는 반환
            }
          }
        }
      } else {
        // Subsequent pages: cursor-based pagination
        const [lastOrder] = cursor.split("_");
        const allListings = await prisma.listing.findMany({
          where: {
            ...where,
            listingExposureOrder: { gt: parseInt(lastOrder, 10) },
          },
          select: {
            id: true, title: true, businessCategory: true, storeType: true,
            price: true, monthlyRent: true, managementFee: true, premiumFee: true,
            monthlyRevenue: true, monthlyProfit: true, areaPyeong: true, floor: true,
            city: true, district: true, neighborhood: true, latitude: true, longitude: true,
            safetyGrade: true, isPremium: true, isRecommended: true, premiumRank: true,
            hasDiagnosisBadge: true, viewCount: true, listingExposureOrder: true,
            images: { where: { isPrimary: true }, take: 1, select: { url: true, thumbnailUrl: true } },
            seller: { select: { name: true, image: true, isTrustedSeller: true } },
          },
          orderBy: { listingExposureOrder: "asc" },
          take: 21,
        });

        listings = allListings.slice(0, 20);
        if (allListings.length > 20) {
          const lastListing = listings[listings.length - 1] as Record<string, unknown>;
          nextCursor = `${lastListing.listingExposureOrder}_${Date.now()}`;
        }
      }

      // Fetch paid services for all sections
      const now = new Date();
      const allIds = [
        ...(premiumTop as Array<Record<string, unknown>>).map(l => l.id as string),
        ...(recommended as Array<Record<string, unknown>>).map(l => l.id as string),
        ...(listings as Array<Record<string, unknown>>).map(l => l.id as string),
      ];

      const activePaidServices = allIds.length > 0
        ? await prisma.paidService.findMany({
            where: {
              listingId: { in: allIds },
              type: { in: ["JUMP_UP", "AUTO_REFRESH", "URGENT_TAG"] },
              status: "ACTIVE",
              endDate: { gt: now },
            },
            select: { listingId: true, type: true, reason: true },
          })
        : [];

      const boostSet = new Set(
        activePaidServices.filter((s) => s.type !== "URGENT_TAG").map((s) => s.listingId)
      );
      const urgentMap = new Map(
        activePaidServices.filter((s) => s.type === "URGENT_TAG").map((s) => [s.listingId, s.reason])
      );

      // Filter urgentOnly in rotation mode
      if (urgentOnly) {
        const urgentIds = new Set(urgentMap.keys());
        premiumTop = (premiumTop as Array<Record<string, unknown>>).filter(l => urgentIds.has(l.id as string));
        recommended = (recommended as Array<Record<string, unknown>>).filter(l => urgentIds.has(l.id as string));
        listings = (listings as Array<Record<string, unknown>>).filter(l => urgentIds.has(l.id as string));
      }

      const serializeItem = (l: Record<string, unknown>) => ({
        ...l,
        price: String(l.price ?? "0"),
        monthlyRent: l.monthlyRent != null ? String(l.monthlyRent) : null,
        managementFee: l.managementFee != null ? String(l.managementFee) : null,
        premiumFee: l.premiumFee != null ? String(l.premiumFee) : null,
        monthlyRevenue: l.monthlyRevenue != null ? String(l.monthlyRevenue) : null,
        monthlyProfit: l.monthlyProfit != null ? String(l.monthlyProfit) : null,
        isJumpUp: boostSet.has(l.id as string),
        urgentTag: urgentMap.has(l.id as string)
          ? { active: true, reason: urgentMap.get(l.id as string) ?? null }
          : null,
        listingExposureOrder: undefined, // Don't expose to client
      });

      return new Response(
        JSON.stringify({
          premiumTop: (premiumTop as Array<Record<string, unknown>>).map(serializeItem),
          recommended: (recommended as Array<Record<string, unknown>>).map(serializeItem),
          data: (listings as Array<Record<string, unknown>>).map(serializeItem),
          meta: {
            nextCursor,
            hasMore: nextCursor != null,
            total: totalCount,
          },
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
          },
        },
      );
    }

    // ── Non-rotation mode (standard sort) ──
    const sortMapping: Record<string, Record<string, string>> = {
      price_asc: { price: "asc" },
      price_desc: { price: "desc" },
      revenue: { monthlyRevenue: "desc" },
      profit: { monthlyProfit: "desc" },
      views: { viewCount: "desc" },
      createdAt: { createdAt: "desc" },
    };

    const orderBy: Record<string, unknown>[] = [];

    if (sortMapping[sort]) {
      orderBy.push(sortMapping[sort]);
    } else if (parsed.sortBy === "safetyGrade") {
      orderBy.push({ safetyGrade: { sort: "asc", nulls: "last" } });
    } else {
      orderBy.push({ [parsed.sortBy]: parsed.sortOrder });
    }

    const listings = await prisma.listing.findMany({
      where: {
        ...where,
        ...(parsed.cursor ? { id: { lt: parsed.cursor } } : {}),
      },
      select: {
        id: true,
        title: true,
        businessCategory: true,
        storeType: true,
        price: true,
        monthlyRent: true,
        managementFee: true,
        premiumFee: true,
        monthlyRevenue: true,
        monthlyProfit: true,
        areaPyeong: true,
        floor: true,
        city: true,
        district: true,
        neighborhood: true,
        latitude: true,
        longitude: true,
        safetyGrade: true,
        isPremium: true,
        premiumRank: true,
        hasDiagnosisBadge: true,
        viewCount: true,
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true, thumbnailUrl: true },
        },
        seller: { select: { name: true, image: true, isTrustedSeller: true } },
      },
      orderBy,
      take: parsed.limit + 1,
    });

    const hasMore = listings.length > parsed.limit;
    const data = hasMore ? listings.slice(0, -1) : listings;

    // Fetch active paid services in a single query
    const now = new Date();
    const listingIds = data.map((l) => l.id);

    const activePaidServices = listingIds.length > 0
      ? await prisma.paidService.findMany({
          where: {
            listingId: { in: listingIds },
            type: { in: ["JUMP_UP", "AUTO_REFRESH", "URGENT_TAG"] },
            status: "ACTIVE",
            endDate: { gt: now },
          },
          select: { listingId: true, type: true, reason: true, startDate: true },
        })
      : [];

    const boostSet = new Set(
      activePaidServices.filter((s) => s.type !== "URGENT_TAG").map((s) => s.listingId)
    );
    const urgentMap = new Map(
      activePaidServices.filter((s) => s.type === "URGENT_TAG").map((s) => [s.listingId, s.reason])
    );

    // Sort: boosted listings first (keeping premiumRank priority)
    let sortedData = [...data].sort((a, b) => {
      // PremiumRank already handled by query, so only re-sort within same rank
      if (a.premiumRank !== b.premiumRank) return 0;
      const aBoost = boostSet.has(a.id) ? 1 : 0;
      const bBoost = boostSet.has(b.id) ? 1 : 0;
      return bBoost - aBoost;
    });

    // Filter to urgent-only listings if requested
    if (urgentOnly) {
      const urgentIds = new Set(urgentMap.keys());
      sortedData = sortedData.filter((l) => urgentIds.has(l.id));
    }

    return new Response(
      JSON.stringify({
        data: sortedData.map((l) => ({
          ...l,
          price: l.price.toString(),
          monthlyRent: l.monthlyRent?.toString() ?? null,
          managementFee: l.managementFee?.toString() ?? null,
          premiumFee: l.premiumFee?.toString() ?? null,
          monthlyRevenue: l.monthlyRevenue?.toString() ?? null,
          monthlyProfit: l.monthlyProfit?.toString() ?? null,
          isJumpUp: boostSet.has(l.id),
          urgentTag: urgentMap.has(l.id)
            ? { active: true, reason: urgentMap.get(l.id) ?? null }
            : null,
        })),
        meta: {
          cursor: data[data.length - 1]?.id,
          hasMore,
          total: sortedData.length < parsed.limit && !hasMore
            ? sortedData.length
            : await prisma.listing.count({ where: { status: "ACTIVE", ...where } }),
        },
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
        },
      },
    );
  } catch (error) {
    return errorToResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: { message: "인증이 필요합니다." } }, { status: 401 });
    }
    if (session.user.role !== "SELLER" && session.user.role !== "ADMIN") {
      return Response.json({ error: { message: "판매자만 매물을 등록할 수 있습니다." } }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createListingSchema.parse(body);

    // ── Duplicate active listing check ──
    const duplicateWhere: Record<string, unknown> = {
      sellerId: session.user.id,
      status: "ACTIVE",
      address: parsed.address,
      floor: parsed.floor ?? null,
    };
    if (parsed.unit) {
      duplicateWhere.unit = parsed.unit;
    } else {
      duplicateWhere.title = parsed.title;
    }
    const existingDuplicate = await prisma.listing.findFirst({ where: duplicateWhere });
    if (existingDuplicate) {
      return Response.json(
        { error: { message: "동일한 주소/층수/호수의 매물이 이미 등록되어 있습니다." } },
        { status: 409 },
      );
    }

    // ── Monthly free listing limit (2 per month) ──
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyCount = await prisma.listing.count({
      where: {
        sellerId: session.user.id,
        createdAt: { gte: monthStart },
      },
    });
    if (monthlyCount >= 2) {
      return Response.json(
        { error: { message: "무료 매물 등록은 월 2건까지 가능합니다." } },
        { status: 429 },
      );
    }

    const listing = await prisma.listing.create({
      data: {
        sellerId: session.user.id,
        ...parsed,
        price: BigInt(parsed.price),
        monthlyRent: parsed.monthlyRent ? BigInt(parsed.monthlyRent) : null,
        managementFee: parsed.managementFee ? BigInt(parsed.managementFee) : null,
        premiumFee: parsed.premiumFee ? BigInt(parsed.premiumFee) : null,
        monthlyRevenue: parsed.monthlyRevenue ? BigInt(parsed.monthlyRevenue) : null,
        monthlyProfit: parsed.monthlyProfit ? BigInt(parsed.monthlyProfit) : null,
        businessSubtype: parsed.businessSubtype ?? null,
        operatingYears: parsed.operatingYears ?? null,
        areaPyeong: parsed.areaM2 ? m2ToPyeong(parsed.areaM2) : null,
        status: "PENDING_VERIFICATION",
      },
    });

    // Assign listingExposureOrder for rotation queue
    const listingOrder = await assignExposureOrder("listing");
    await prisma.listing.update({
      where: { id: listing.id },
      data: { listingExposureOrder: listingOrder },
    });

    // Save uploaded images
    const CATEGORY_ORDER: Record<string, number> = {
      exterior: 0, interior: 1, kitchen: 2, bathroom: 3,
      signage: 4, hall: 5, parking: 6, other: 7,
    };
    const images = body.images as { key: string; url: string; category?: string }[] | undefined;
    if (images && images.length > 0) {
      // Sort by category order for consistent display
      const sorted = [...images].sort((a, b) => {
        const oa = CATEGORY_ORDER[a.category ?? "other"] ?? 99;
        const ob = CATEGORY_ORDER[b.category ?? "other"] ?? 99;
        return oa - ob;
      });

      const useS3 = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

      for (let i = 0; i < sorted.length; i++) {
        const img = sorted[i];
        const imageUrl = useS3
          ? `https://${S3_BUCKET_UPLOADS}.s3.amazonaws.com/${img.key}`
          : img.url;

        const imageRecord = await prisma.listingImage.create({
          data: {
            listingId: listing.id,
            s3Key: img.category ? `${img.category}/${img.key}` : img.key,
            url: imageUrl,
            sortOrder: i,
            isPrimary: i === 0,
          },
        });

        // Queue image processing (thumbnail + hash) - skip if Redis unavailable
        try {
          await imageProcessingQueue.add("process", {
            imageId: imageRecord.id,
            s3Key: img.key,
          });
        } catch {}
      }
    }

    // Save uploaded revenue documents
    const documents = body.documents as { name: string; key: string; url: string; size?: number; mimeType?: string }[] | undefined;
    if (documents && documents.length > 0) {
      for (const doc of documents) {
        await prisma.document.create({
          data: {
            uploaderId: session.user.id,
            listingId: listing.id,
            documentType: "OTHER",
            fileName: doc.name,
            mimeType: doc.mimeType ?? "application/octet-stream",
            sizeBytes: doc.size ?? 0,
            s3Key: doc.key,
            accessLevel: "OWNER_ONLY",
            consentGiven: true,
            consentGivenAt: new Date(),
          },
        });
      }
    }

    // Trigger fraud detection - skip if Redis unavailable
    try {
      await fraudDetectionQueue.add("evaluate", { listingId: listing.id });
    } catch {}

    // Grade notification
    if (listing.safetyGrade && listing.safetyGrade !== "C") {
      try {
        const { notifyGradeUpgrade } = await import("@/lib/utils/grade-notification");
        await notifyGradeUpgrade(
          session.user.id,
          listing.id,
          listing.title,
          null,
          listing.safetyGrade,
        );
      } catch {}
    }

    return Response.json(
      {
        data: {
          ...listing,
          price: listing.price.toString(),
          monthlyRent: listing.monthlyRent?.toString() ?? null,
          managementFee: listing.managementFee?.toString() ?? null,
          premiumFee: listing.premiumFee?.toString() ?? null,
          monthlyRevenue: listing.monthlyRevenue?.toString() ?? null,
          monthlyProfit: listing.monthlyProfit?.toString() ?? null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return errorToResponse(error);
  }
}
