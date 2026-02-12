import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorToResponse } from "@/lib/utils/errors";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const category = sp.get("category");
    const region = sp.get("region");
    const sort = sp.get("sort") ?? "recommended";
    const page = Math.max(1, Number(sp.get("page") ?? "1"));
    const limit = Math.min(Math.max(1, Number(sp.get("limit") ?? "12")), 50);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (category) where.category = category;
    if (region) where.region = region;

    let orderBy: Record<string, string>[];
    switch (sort) {
      case "rating":
        orderBy = [{ rating: "desc" }, { reviewCount: "desc" }];
        break;
      case "consultations":
      case "consultCount":
        orderBy = [{ consultCount: "desc" }];
        break;
      case "recommended":
      default:
        orderBy = [
          { isVerified: "desc" },
          { rating: "desc" },
          { consultCount: "desc" },
        ];
        break;
    }

    const [rows, total] = await Promise.all([
      prisma.expert.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.expert.count({ where }),
    ]);

    const experts = rows.map((e) => ({
      id: e.id,
      name: e.name,
      title: e.title,
      company: e.company,
      category: e.category,
      region: e.region,
      profileImage: e.profileImage,
      specialties: e.specialties as string[],
      rating: e.rating,
      reviewCount: e.reviewCount,
      consultationCount: e.consultCount,
      experienceYears: e.career,
      isVerified: e.isVerified,
    }));

    return Response.json({
      experts,
      total,
      page,
      limit,
      hasMore: skip + rows.length < total,
    });
  } catch (error) {
    return errorToResponse(error);
  }
}
