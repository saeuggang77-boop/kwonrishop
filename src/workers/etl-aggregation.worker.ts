import { Worker, type Job } from "bullmq";
import { redis } from "@/lib/redis/client";
import { aggregateDailyListingMetrics } from "@/lib/etl/daily-metrics";
import { aggregateDailySellerMetrics } from "@/lib/etl/seller-metrics";

interface EtlJobData {
  date?: string; // ISO date string, defaults to yesterday
}

async function runEtlAggregation(job: Job<EtlJobData>) {
  const date = job.data.date ? new Date(job.data.date) : undefined;

  // Step 1: Aggregate listing metrics from events
  const listingCount = await aggregateDailyListingMetrics(date);

  // Step 2: Aggregate seller metrics from listing metrics
  const sellerCount = await aggregateDailySellerMetrics(date);

  return {
    listingMetricsCreated: listingCount,
    sellerMetricsCreated: sellerCount,
    processedAt: new Date().toISOString(),
  };
}

export const etlAggregationWorker = new Worker<EtlJobData>(
  "etl-aggregation",
  runEtlAggregation,
  {
    connection: redis,
    concurrency: 1, // Sequential to avoid conflicts
  }
);

etlAggregationWorker.on("completed", (job, result) => {
  console.log(
    `[etl-aggregation] Completed: ${job.id} — listings: ${result?.listingMetricsCreated ?? 0}, sellers: ${result?.sellerMetricsCreated ?? 0}`
  );
});

etlAggregationWorker.on("failed", (job, err) => {
  console.error(`[etl-aggregation] Failed: ${job?.id}`, err.message);
});
