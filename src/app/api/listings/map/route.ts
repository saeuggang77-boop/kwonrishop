import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorToResponse } from "@/lib/utils/errors";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const mode = sp.get("mode") ?? "clusters";
    const zoom = parseInt(sp.get("zoom") ?? "8", 10);

    // ── Build common Prisma where ──
    const where: Record<string, unknown> = {
      status: "ACTIVE",
      latitude: { not: null },
      longitude: { not: null },
    };

    const businessCategory = sp.get("businessCategory");
    const businessSubtype = sp.get("businessSubtype");
    const storeType = sp.get("storeType");
    const city = sp.get("city");
    const district = sp.get("district");
    const trustedOnly = sp.get("trustedOnly") === "true";
    const diagnosisOnly = sp.get("diagnosisOnly") === "true";
    const premiumFeeMax = sp.get("premiumFeeMax");
    const monthlyProfitMin = sp.get("monthlyProfitMin");
    const monthlyProfitMax = sp.get("monthlyProfitMax");
    const totalCostMin = sp.get("totalCostMin");
    const totalCostMax = sp.get("totalCostMax");

    if (businessCategory) where.businessCategory = businessCategory;
    if (businessSubtype) where.businessSubtype = businessSubtype;
    if (storeType) where.storeType = storeType;
    if (city) where.city = city;
    if (district) where.district = district;
    if (trustedOnly) where.seller = { isTrustedSeller: true };
    if (diagnosisOnly) where.hasDiagnosisBadge = true;
    if (premiumFeeMax === "0") {
      if (!where.AND) where.AND = [];
      (where.AND as unknown[]).push({
        OR: [{ premiumFee: null }, { premiumFee: BigInt(0) }],
      });
    }
    if (monthlyProfitMin || monthlyProfitMax) {
      where.monthlyProfit = {};
      if (monthlyProfitMin)
        (where.monthlyProfit as Record<string, unknown>).gte = BigInt(monthlyProfitMin);
      if (monthlyProfitMax)
        (where.monthlyProfit as Record<string, unknown>).lte = BigInt(monthlyProfitMax);
    }
    if (totalCostMin || totalCostMax) {
      const conditions: string[] = ['"status" = \'ACTIVE\''];
      const queryParams: unknown[] = [];
      let idx = 1;
      if (totalCostMin) {
        conditions.push(`("price" + COALESCE("premiumFee", 0)) >= $${idx}`);
        queryParams.push(BigInt(totalCostMin));
        idx++;
      }
      if (totalCostMax) {
        conditions.push(`("price" + COALESCE("premiumFee", 0)) <= $${idx}`);
        queryParams.push(BigInt(totalCostMax));
        idx++;
      }
      const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT "id" FROM "Listing" WHERE ${conditions.join(" AND ")}`,
        ...queryParams,
      );
      if (!where.AND) where.AND = [];
      (where.AND as unknown[]).push({ id: { in: rows.map((r) => r.id) } });
    }

    // ── Markers mode: individual listings within bounds ──
    if (mode === "markers") {
      const swLat = parseFloat(sp.get("swLat") ?? "0");
      const swLng = parseFloat(sp.get("swLng") ?? "0");
      const neLat = parseFloat(sp.get("neLat") ?? "0");
      const neLng = parseFloat(sp.get("neLng") ?? "0");

      if (!swLat && !swLng && !neLat && !neLng) {
        return Response.json({ data: [] });
      }

      where.latitude = { gte: swLat, lte: neLat };
      where.longitude = { gte: swLng, lte: neLng };

      const listings = await prisma.listing.findMany({
        where,
        select: {
          id: true,
          title: true,
          businessCategory: true,
          price: true,
          monthlyRent: true,
          premiumFee: true,
          city: true,
          district: true,
          neighborhood: true,
          latitude: true,
          longitude: true,
          isPremium: true,
          premiumRank: true,
          safetyGrade: true,
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true, thumbnailUrl: true },
          },
        },
        take: 200,
        orderBy: [{ premiumRank: "desc" }, { createdAt: "desc" }],
      });

      return Response.json(
        {
          data: listings.map((l) => ({
            ...l,
            price: l.price.toString(),
            monthlyRent: l.monthlyRent?.toString() ?? null,
            premiumFee: l.premiumFee?.toString() ?? null,
          })),
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
          },
        },
      );
    }

    // ── Clusters mode: group by district or neighborhood ──
    const listings = await prisma.listing.findMany({
      where,
      select: {
        city: true,
        district: true,
        neighborhood: true,
        latitude: true,
        longitude: true,
      },
    });

    const groups = new Map<
      string,
      { name: string; count: number; latSum: number; lngSum: number }
    >();

    for (const l of listings) {
      if (!l.latitude || !l.longitude) continue;
      let key: string;
      let name: string;
      if (zoom >= 9) {
        // District level (zoomed out)
        key = `${l.city}|${l.district}`;
        name = l.district;
      } else {
        // Neighborhood level (zoomed in)
        const nh = l.neighborhood ?? l.district;
        key = `${l.city}|${l.district}|${nh}`;
        name = nh;
      }
      const g = groups.get(key);
      if (g) {
        g.count++;
        g.latSum += l.latitude;
        g.lngSum += l.longitude;
      } else {
        groups.set(key, { name, count: 1, latSum: l.latitude, lngSum: l.longitude });
      }
    }

    const clusters = Array.from(groups.values())
      .map((g) => ({
        name: g.name,
        count: g.count,
        lat: g.latSum / g.count,
        lng: g.lngSum / g.count,
      }))
      .sort((a, b) => b.count - a.count);

    return Response.json(
      { data: clusters },
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (error) {
    return errorToResponse(error);
  }
}
