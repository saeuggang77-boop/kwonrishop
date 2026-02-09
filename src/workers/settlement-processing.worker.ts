import { Worker, type Job } from "bullmq";
import { redis } from "@/lib/redis/client";
import { processSettlements } from "@/lib/settlement/processor";

interface SettlementJobData {
  date?: string; // ISO date string, defaults to yesterday
}

async function processSettlementJob(job: Job<SettlementJobData>) {
  const date = job.data.date ? new Date(job.data.date) : undefined;
  const count = await processSettlements(date);

  return {
    settlementsProcessed: count,
    processedAt: new Date().toISOString(),
  };
}

export const settlementProcessingWorker = new Worker<SettlementJobData>(
  "settlement-processing",
  processSettlementJob,
  {
    connection: redis,
    concurrency: 1, // Sequential settlement processing
  }
);

settlementProcessingWorker.on("completed", (job, result) => {
  console.log(
    `[settlement-processing] Completed: ${job.id} — ${result?.settlementsProcessed ?? 0} settlements`
  );
});

settlementProcessingWorker.on("failed", (job, err) => {
  console.error(`[settlement-processing] Failed: ${job?.id}`, err.message);
});
