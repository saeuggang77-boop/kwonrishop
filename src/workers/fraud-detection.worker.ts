import { Worker, type Job } from "bullmq";
import { redis } from "@/lib/redis/client";
import { evaluateListing, processFraudViolations } from "@/lib/fraud/engine";
import { sendEmail } from "@/lib/ses/send";
import { fraudAlertEmail } from "@/lib/ses/templates";
import { prisma } from "@/lib/prisma";

interface FraudJobData {
  listingId: string;
  triggeredBy: "CREATE" | "UPDATE";
}

async function detectFraud(job: Job<FraudJobData>) {
  const { listingId, triggeredBy } = job.data;

  // Run all active fraud rules
  const violations = await evaluateListing(listingId);

  if (violations.length === 0) {
    return { listingId, triggeredBy, violationsFound: 0 };
  }

  // Process violations (update listing status, create records, create notifications)
  await processFraudViolations(listingId, violations);

  // Send email alert to seller
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { title: true, sellerId: true },
  });

  if (listing) {
    const seller = await prisma.user.findUnique({
      where: { id: listing.sellerId },
      select: { name: true, email: true },
    });

    if (seller?.email) {
      const ruleDescriptions = violations
        .map((v) => v.ruleType)
        .join(", ");

      const email = fraudAlertEmail({
        sellerName: seller.name ?? "판매자",
        listingTitle: listing.title,
        ruleDescription: ruleDescriptions,
        actionRequired:
          "매물 정보를 확인하시고, 문제가 없다면 고객센터로 연락해 주세요.",
      });

      await sendEmail({
        to: seller.email,
        subject: email.subject,
        html: email.html,
      });
    }
  }

  return {
    listingId,
    triggeredBy,
    violationsFound: violations.length,
    ruleTypes: violations.map((v) => v.ruleType),
  };
}

export const fraudDetectionWorker = new Worker<FraudJobData>(
  "fraud-detection",
  detectFraud,
  {
    connection: redis,
    concurrency: 3,
  }
);

fraudDetectionWorker.on("completed", (job, result) => {
  console.log(
    `[fraud-detection] Completed: ${job.id} — ${result?.violationsFound ?? 0} violations`
  );
});

fraudDetectionWorker.on("failed", (job, err) => {
  console.error(`[fraud-detection] Failed: ${job?.id}`, err.message);
});
