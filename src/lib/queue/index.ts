import { Queue } from "bullmq";
import { redis } from "@/lib/redis/client";

const defaultOptions = {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: { age: 86400 }, // 24 hours
    removeOnFail: { age: 604800 }, // 7 days
    attempts: 3,
    backoff: {
      type: "exponential" as const,
      delay: 1000,
    },
  },
};

export const fraudDetectionQueue = new Queue("fraud-detection", defaultOptions);
export const imageProcessingQueue = new Queue("image-processing", defaultOptions);
export const reportGenerationQueue = new Queue("report-generation", defaultOptions);
export const emailQueue = new Queue("email-notification", defaultOptions);
export const settlementQueue = new Queue("settlement-processing", defaultOptions);
export const documentCleanupQueue = new Queue("document-cleanup", defaultOptions);
export const etlQueue = new Queue("etl-aggregation", defaultOptions);
export const comparisonQueue = new Queue("comparison-collection", defaultOptions);
