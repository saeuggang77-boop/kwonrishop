/**
 * Worker entry point — runs all BullMQ workers.
 * Start with: npx tsx src/workers/index.ts
 * Deploy on: ECS Fargate (long-running process)
 */

import { imageProcessingWorker } from "./image-processing.worker";
import { fraudDetectionWorker } from "./fraud-detection.worker";
import { reportGenerationWorker } from "./report-generation.worker";
import { emailNotificationWorker } from "./email-notification.worker";
import { settlementProcessingWorker } from "./settlement-processing.worker";
import { documentCleanupWorker } from "./document-cleanup.worker";
import { etlAggregationWorker } from "./etl-aggregation.worker";
import { comparisonCollectionWorker } from "./comparison-collection.worker";

const workers = [
  imageProcessingWorker,
  fraudDetectionWorker,
  reportGenerationWorker,
  emailNotificationWorker,
  settlementProcessingWorker,
  documentCleanupWorker,
  etlAggregationWorker,
  comparisonCollectionWorker,
];

console.log(`[workers] Starting ${workers.length} workers...`);

for (const worker of workers) {
  console.log(`[workers] ✓ ${worker.name} (concurrency: ${worker.opts.concurrency})`);
}

// Graceful shutdown
async function shutdown() {
  console.log("[workers] Shutting down...");
  await Promise.all(workers.map((w) => w.close()));
  console.log("[workers] All workers stopped.");
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
