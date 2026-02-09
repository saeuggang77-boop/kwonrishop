import { Worker, type Job } from "bullmq";
import { redis } from "@/lib/redis/client";
import { sendEmail } from "@/lib/ses/send";

interface EmailJobData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

async function processEmail(job: Job<EmailJobData>) {
  const { to, subject, html, text } = job.data;

  await sendEmail({ to, subject, html, text });

  return {
    to: Array.isArray(to) ? to : [to],
    subject,
    sentAt: new Date().toISOString(),
  };
}

export const emailNotificationWorker = new Worker<EmailJobData>(
  "email-notification",
  processEmail,
  {
    connection: redis,
    concurrency: 10,
    limiter: { max: 14, duration: 1_000 }, // SES rate limit ~14/sec
  }
);

emailNotificationWorker.on("completed", (job) => {
  console.log(`[email-notification] Sent: ${job.id}`);
});

emailNotificationWorker.on("failed", (job, err) => {
  console.error(`[email-notification] Failed: ${job?.id}`, err.message);
});
