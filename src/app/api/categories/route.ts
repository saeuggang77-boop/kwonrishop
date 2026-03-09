import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      subCategories: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json(categories, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
