import { Worker, type Job } from "bullmq";
import { redis } from "@/lib/redis/client";
import { prisma } from "@/lib/prisma";
import { deleteFromS3 } from "@/lib/s3/upload";

interface CleanupJobData {
  batchSize?: number;
}

async function cleanupExpiredDocuments(job: Job<CleanupJobData>) {
  const batchSize = job.data.batchSize ?? 100;

  // Find expired documents
  const expiredDocs = await prisma.document.findMany({
    where: {
      expiresAt: { lte: new Date() },
      isDeleted: false,
    },
    take: batchSize,
    select: { id: true, s3Key: true },
  });

  let deletedCount = 0;

  for (const doc of expiredDocs) {
    try {
      // Delete from S3
      await deleteFromS3(doc.s3Key);

      // Mark as deleted in DB
      await prisma.document.update({
        where: { id: doc.id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      deletedCount++;
    } catch (error) {
      console.error(`[document-cleanup] Failed to delete doc ${doc.id}:`, error);
    }
  }

  return {
    scanned: expiredDocs.length,
    deleted: deletedCount,
    processedAt: new Date().toISOString(),
  };
}

export const documentCleanupWorker = new Worker<CleanupJobData>(
  "document-cleanup",
  cleanupExpiredDocuments,
  {
    connection: redis,
    concurrency: 2,
  }
);

documentCleanupWorker.on("completed", (job, result) => {
  console.log(
    `[document-cleanup] Completed: ${job.id} — ${result?.deleted ?? 0} deleted`
  );
});

documentCleanupWorker.on("failed", (job, err) => {
  console.error(`[document-cleanup] Failed: ${job?.id}`, err.message);
});
