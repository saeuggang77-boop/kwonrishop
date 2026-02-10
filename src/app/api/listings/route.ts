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
    if (parsed.storeType) where.storeType = parsed.storeType;
    if (parsed.city) where.city = parsed.city;
    if (parsed.district) where.district = parsed.district;
    if (parsed.priceMin || parsed.priceMax) {
      where.price = {};
      if (parsed.priceMin) (where.price as Record<string, unknown>).gte = BigInt(parsed.priceMin);
      if (parsed.priceMax) (where.price as Record<string, unknown>).lte = BigInt(parsed.priceMax);
    }

    const orderBy = { [parsed.sortBy]: parsed.sortOrder };

    const listings = await prisma.listing.findMany({
      where: {
        ...where,
        ...(parsed.cursor ? { id: { lt: parsed.cursor } } : {}),
      },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        seller: { select: { name: true, image: true } },
      },
      orderBy,
      take: parsed.limit + 1,
    });

    const hasMore = listings.length > parsed.limit;
    const data = hasMore ? listings.slice(0, -1) : listings;

    return Response.json({
      data: data.map((l) => ({
        ...l,
        price: l.price.toString(),
        monthlyRent: l.monthlyRent?.toString() ?? null,
        managementFee: l.managementFee?.toString() ?? null,
        premiumFee: l.premiumFee?.toString() ?? null,
        monthlyRevenue: l.monthlyRevenue?.toString() ?? null,
        monthlyProfit: l.monthlyProfit?.toString() ?? null,
      })),
      meta: {
        cursor: data[data.length - 1]?.id,
        hasMore,
      },
    });
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
        status: "ACTIVE",
        publishedAt: new Date(),
      },
    });

    // Save uploaded images
    const images = body.images as { key: string; url: string }[] | undefined;
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const imageRecord = await prisma.listingImage.create({
          data: {
            listingId: listing.id,
            s3Key: img.key,
            url: `https://${S3_BUCKET_UPLOADS}.s3.amazonaws.com/${img.key}`,
            sortOrder: i,
            isPrimary: i === 0,
          },
        });

        // Queue image processing (thumbnail + hash)
        await imageProcessingQueue.add("process", {
          imageId: imageRecord.id,
          s3Key: img.key,
        });
      }
    }

    // Trigger fraud detection
    await fraudDetectionQueue.add("evaluate", { listingId: listing.id });

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
