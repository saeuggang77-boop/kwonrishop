import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Seed data for when there's no search history
const SEED_KEYWORDS = [
  "강남 카페",
  "홍대 음식점",
  "분식집",
  "치킨",
  "편의점",
  "네일샵",
  "PC방",
  "학원",
];

export async function GET() {
  try {
    // Try to get real search data from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const searchEvents = await prisma.event.findMany({
      where: {
        eventType: "SEARCH_PERFORMED",
        createdAt: {
          gte: sevenDaysAgo,
        },
        metadata: {
          not: null as any,
        },
      },
      select: {
        metadata: true,
      },
    });

    // Extract and count search keywords
    const keywordCounts = new Map<string, number>();

    for (const event of searchEvents) {
      const metadata = event.metadata as any;
      const query = metadata?.query || metadata?.searchQuery || metadata?.keyword;

      if (typeof query === "string" && query.trim().length > 0) {
        const normalized = query.trim().toLowerCase();
        keywordCounts.set(normalized, (keywordCounts.get(normalized) || 0) + 1);
      }
    }

    let keywords: string[];

    // If we have enough real data, use top 8
    if (keywordCounts.size >= 5) {
      keywords = Array.from(keywordCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([keyword]) => keyword);
    } else {
      // Otherwise use seed data
      keywords = SEED_KEYWORDS;
    }

    return NextResponse.json(
      { keywords },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching popular searches:", error);

    // Fallback to seed data on error
    return NextResponse.json(
      { keywords: SEED_KEYWORDS },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      }
    );
  }
}
