import { Queue, type QueueOptions } from "bullmq";
import { getRedis } from "@/lib/redis/client";

function createLazyQueue(name: string): Queue {
  let instance: Queue | null = null;
  return new Proxy({} as Queue, {
    get(_target, prop, receiver) {
      if (!instance) {
        const opts: QueueOptions = {
          connection: getRedis(),
          defaultJobOptions: {
            removeOnComplete: { age: 86400 },
            removeOnFail: { age: 604800 },
            attempts: 3,
            backoff: {
              type: "exponential" as const,
              delay: 1000,
            },
          },
        };
        instance = new Queue(name, opts);
      }
      const value = Reflect.get(instance, prop, receiver);
      if (typeof value === "function") {
        return value.bind(instance);
      }
      return value;
    },
  });
}

export const fraudDetectionQueue = createLazyQueue("fraud-detection");
export const imageProcessingQueue = createLazyQueue("image-processing");
export const reportGenerationQueue = createLazyQueue("report-generation");
export const emailQueue = createLazyQueue("email-notification");
export const settlementQueue = createLazyQueue("settlement-processing");
export const documentCleanupQueue = createLazyQueue("document-cleanup");
export const etlQueue = createLazyQueue("etl-aggregation");
export const comparisonQueue = createLazyQueue("comparison-collection");
