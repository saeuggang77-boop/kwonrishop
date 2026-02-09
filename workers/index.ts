import { Worker } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

console.log("Starting KwonriShop workers...");

// Fraud Detection Worker
new Worker(
  "fraud-detection",
  async (job) => {
    const { evaluateListing, processFraudViolations } = await import("../src/lib/fraud/engine");
    const { listingId } = job.data;
    console.log(`[fraud-detection] Evaluating listing ${listingId}`);
    const violations = await evaluateListing(listingId);
    await processFraudViolations(listingId, violations);
    console.log(`[fraud-detection] Found ${violations.length} violations for ${listingId}`);
  },
  { connection, concurrency: 3 }
);

// Image Processing Worker
new Worker(
  "image-processing",
  async (job) => {
    const { computePerceptualHash, computeAverageHash } = await import("../src/lib/fraud/hash");
    const { prisma } = await import("../src/lib/prisma");
    const { imageId, s3Key } = job.data;
    console.log(`[image-processing] Processing image ${imageId}`);

    // In production: download from S3, process with sharp, upload thumbnails
    // For now, update hash if image buffer is provided
    if (job.data.buffer) {
      const buffer = Buffer.from(job.data.buffer, "base64");
      const [pHash, aHash] = await Promise.all([
        computePerceptualHash(buffer),
        computeAverageHash(buffer),
      ]);

      await prisma.listingImage.update({
        where: { id: imageId },
        data: { perceptualHash: pHash, averageHash: aHash },
      });
    }
  },
  { connection, concurrency: 5 }
);

// Email Notification Worker
new Worker(
  "email-notification",
  async (job) => {
    const { sendEmail } = await import("../src/lib/ses/send");
    const { to, subject, html } = job.data;
    console.log(`[email] Sending to ${to}: ${subject}`);
    await sendEmail({ to, subject, html });
  },
  { connection, concurrency: 10 }
);

// Report Generation Worker
new Worker(
  "report-generation",
  async (job) => {
    const { prisma } = await import("../src/lib/prisma");
    const { buildReportMeta } = await import("../src/lib/report/disclaimer");
    const { reportId } = job.data;
    console.log(`[report-generation] Generating report ${reportId}`);

    await prisma.report.update({
      where: { id: reportId },
      data: { status: "PROCESSING" },
    });

    try {
      const report = await prisma.report.findUniqueOrThrow({
        where: { id: reportId },
        include: { listing: true, user: true },
      });

      const meta = buildReportMeta();

      // TODO: Generate actual PDF with @react-pdf/renderer
      // For now, mark as completed with metadata
      await prisma.report.update({
        where: { id: reportId },
        data: {
          status: "COMPLETED",
          dataSources: meta.dataSources,
          modelAssumptions: meta.modelAssumptions,
          modelVersion: meta.modelVersion,
          generatedAt: new Date(),
          legalDisclaimer: meta.legalDisclaimer,
        },
      });
    } catch (error) {
      await prisma.report.update({
        where: { id: reportId },
        data: {
          status: "FAILED",
          errorMessage: (error as Error).message,
          retryCount: { increment: 1 },
        },
      });
      throw error;
    }
  },
  { connection, concurrency: 2 }
);

// Settlement Worker
new Worker(
  "settlement-processing",
  async (job) => {
    const { processSettlements } = await import("../src/lib/settlement/processor");
    const { date } = job.data;
    console.log(`[settlement] Processing settlements for ${date}`);
    await processSettlements(date ? new Date(date) : undefined);
  },
  { connection, concurrency: 1 }
);

// Document Cleanup Worker
new Worker(
  "document-cleanup",
  async () => {
    const { prisma } = await import("../src/lib/prisma");
    const { deleteFromS3 } = await import("../src/lib/s3/upload");

    const expired = await prisma.document.findMany({
      where: { expiresAt: { lte: new Date() }, isDeleted: false },
    });

    for (const doc of expired) {
      await deleteFromS3(doc.s3Key);
      await prisma.document.update({
        where: { id: doc.id },
        data: { isDeleted: true, deletedAt: new Date() },
      });
    }
    console.log(`[document-cleanup] Cleaned up ${expired.length} documents`);
  },
  { connection, concurrency: 2 }
);

// ETL Aggregation Worker
new Worker(
  "etl-aggregation",
  async () => {
    const { aggregateDailyListingMetrics } = await import("../src/lib/etl/daily-metrics");
    const { aggregateDailySellerMetrics } = await import("../src/lib/etl/seller-metrics");

    const listings = await aggregateDailyListingMetrics();
    const sellers = await aggregateDailySellerMetrics();
    console.log(`[etl] Aggregated: ${listings} listings, ${sellers} sellers`);
  },
  { connection, concurrency: 1 }
);

console.log("All workers started successfully.");
