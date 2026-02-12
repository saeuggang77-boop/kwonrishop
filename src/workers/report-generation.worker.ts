import { Worker, type Job } from "bullmq";
import { redis } from "@/lib/redis/client";
import { prisma } from "@/lib/prisma";
import { uploadToS3 } from "@/lib/s3/upload";
import { getDownloadPresignedUrl } from "@/lib/s3/presigned";
import { sendEmail } from "@/lib/ses/send";
import { reportReadyEmail } from "@/lib/ses/templates";
import { buildReportMeta } from "@/lib/report/disclaimer";
import { createNotification } from "@/lib/notifications/create";
import { valuateListing } from "@/lib/insights/valuation";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { DeepReportDocument, type ReportData } from "@/lib/report/templates/deep-report";

interface ReportJobData {
  reportId: string;
  listingId: string;
  userId: string;
}

async function generateReport(job: Job<ReportJobData>) {
  const { reportId, listingId, userId } = job.data;

  // Mark as processing
  await prisma.report.update({
    where: { id: reportId },
    data: { status: "PROCESSING" },
  });

  try {
    // Fetch listing data
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) throw new Error(`Listing not found: ${listingId}`);

    // Get comparison data
    const comparisons = await prisma.listingComparison.findMany({
      where: { listingId },
      orderBy: { radiusKm: "asc" },
    });

    // Run valuation
    const valuation = await valuateListing(listingId);

    // Build report metadata
    const meta = buildReportMeta();

    // Build report data for React-PDF template
    const reportData: ReportData = {
      listing: {
        title: listing.title,
        price: listing.price.toString(),
        address: `${listing.city} ${listing.district} ${listing.address}`,
        businessCategory: listing.businessCategory,
        storeType: listing.storeType,
        areaM2: listing.areaM2,
        premiumFee: listing.premiumFee?.toString() ?? null,
        monthlyRevenue: listing.monthlyRevenue?.toString() ?? null,
        monthlyProfit: listing.monthlyProfit?.toString() ?? null,
        managementFee: listing.managementFee?.toString() ?? null,
        businessSubtype: listing.businessSubtype,
        operatingYears: listing.operatingYears,
        description: listing.description,
      },
      comparisons: comparisons.map((c) => ({
        radiusKm: c.radiusKm,
        comparableCount: c.comparableCount,
        avgPremiumFee: c.avgPremiumFee?.toString(),
        medianPrice: c.medianPrice?.toString(),
        minPrice: c.minPrice?.toString(),
        maxPrice: c.maxPrice?.toString(),
        pricePercentile: c.pricePercentile,
      })),
      valuation,
      meta,
    };

    // Render PDF using React-PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(DeepReportDocument, { data: reportData }) as React.ReactElement<import("@react-pdf/renderer").DocumentProps>
    );
    const s3Key = `reports/${reportId}.pdf`;
    await uploadToS3(s3Key, Buffer.from(pdfBuffer), "application/pdf", "reports");

    // Generate download URL
    const downloadUrl = await getDownloadPresignedUrl(s3Key, "reports", 259200); // 72h

    // Update report record
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: "COMPLETED",
        s3Key,
        downloadUrl,
        generatedAt: new Date(),
        dataSources: meta.dataSources,
        modelAssumptions: meta.modelAssumptions,
        modelVersion: meta.modelVersion,
        legalDisclaimer: meta.legalDisclaimer,
      },
    });

    // Send email notification
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    if (user?.email) {
      const email = reportReadyEmail({
        userName: user.name ?? "고객",
        listingTitle: listing.title,
        downloadUrl,
      });
      await sendEmail({ to: user.email, subject: email.subject, html: email.html });

      await prisma.report.update({
        where: { id: reportId },
        data: { emailSentAt: new Date() },
      });
    }

    // In-app notification
    await createNotification({
      userId,
      title: "권리진단서가 준비되었습니다",
      message: `"${listing.title}" 매물에 대한 권리진단서가 완성되었습니다.`,
      link: `/reports/${reportId}`,
      sourceType: "REPORT",
      sourceId: reportId,
    });

    return { reportId, s3Key };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: "FAILED",
        errorMessage,
        retryCount: { increment: 1 },
      },
    });

    throw error;
  }
}

export const reportGenerationWorker = new Worker<ReportJobData>(
  "report-generation",
  generateReport,
  {
    connection: redis,
    concurrency: 2,
  }
);

reportGenerationWorker.on("completed", (job) => {
  console.log(`[report-generation] Completed: ${job.id}`);
});

reportGenerationWorker.on("failed", (job, err) => {
  console.error(`[report-generation] Failed: ${job?.id}`, err.message);
});
