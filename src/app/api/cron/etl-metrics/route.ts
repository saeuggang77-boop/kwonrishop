import { aggregateDailyListingMetrics } from "@/lib/etl/daily-metrics";
import { aggregateDailySellerMetrics } from "@/lib/etl/seller-metrics";

export async function POST() {
  try {
    const listingCount = await aggregateDailyListingMetrics();
    const sellerCount = await aggregateDailySellerMetrics();

    return Response.json({
      data: {
        success: true,
        listingsAggregated: listingCount,
        sellersAggregated: sellerCount,
      },
    });
  } catch (error) {
    console.error("ETL metrics CRON failed:", error);
    return Response.json({ error: "ETL failed" }, { status: 500 });
  }
}
