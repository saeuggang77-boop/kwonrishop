import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { searchListingsSchema, createListingSchema } from "@/lib/validators/listing";
import { errorToResponse } from "@/lib/utils/errors";
import { m2ToPyeong } from "@/lib/utils/area";
import { fraudDetectionQueue, imageProcessingQueue } from "@/lib/queue";
import { S3_BUCKET_UPLOADS } from "@/lib/s3/client";

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const parsed = searchListingsSchema.parse(params);

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
    if (parsed.city) where.city = parsed.city;
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
    if (parsed.swLat != null && parsed.swLng != null && parsed.neLat != null && parsed.neLng != null) {
      where.latitude = { gte: parsed.swLat, lte: parsed.neLat };
      where.longitude = { gte: parsed.swLng, lte: parsed.neLng };
    }

    const urgentOnly = req.nextUrl.searchParams.get("urgentOnly") === "true";

    const orderBy: Record<string, unknown>[] = [
      { premiumRank: "desc" as const },
      { hasDiagnosisBadge: "desc" as const },
    ];
    if (parsed.sortBy === "safetyGrade") {
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

    // Fetch active paid services in parallel
    const now = new Date();
    const listingIds = data.map((l) => l.id);
    const [activeBoosts, activeUrgent] = await Promise.all([
      prisma.paidService.findMany({
        where: {
          listingId: { in: listingIds },
          type: { in: ["JUMP_UP", "AUTO_REFRESH"] },
          status: "ACTIVE",
          endDate: { gt: now },
        },
        select: { listingId: true, startDate: true },
        orderBy: { startDate: "desc" },
      }),
      prisma.paidService.findMany({
        where: {
          listingId: { in: listingIds },
          type: "URGENT_TAG",
          status: "ACTIVE",
          endDate: { gt: now },
        },
        select: { listingId: true, reason: true },
      }),
    ]);

    const boostSet = new Set(activeBoosts.map((b) => b.listingId));
    const urgentMap = new Map(activeUrgent.map((u) => [u.listingId, u.reason]));

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
      const urgentIds = new Set(activeUrgent.map((u) => u.listingId));
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
