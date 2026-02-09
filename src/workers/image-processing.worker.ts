import { Worker, type Job } from "bullmq";
import { redis } from "@/lib/redis/client";
import { prisma } from "@/lib/prisma";
import { computeAverageHash, computePerceptualHash } from "@/lib/fraud/hash";
import { uploadToS3 } from "@/lib/s3/upload";
import { s3Client, S3_BUCKET_UPLOADS } from "@/lib/s3/client";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

interface ImageJobData {
  imageId: string;
  s3Key: string;
}

async function processImage(job: Job<ImageJobData>) {
  const { imageId, s3Key } = job.data;

  // Fetch image from S3
  const response = await s3Client.send(
    new GetObjectCommand({ Bucket: S3_BUCKET_UPLOADS, Key: s3Key })
  );
  const bodyBytes = await response.Body?.transformToByteArray();
  if (!bodyBytes) throw new Error(`Failed to fetch image: ${s3Key}`);

  const buffer = Buffer.from(bodyBytes);

  // Generate thumbnail (400x300, cover)
  const thumbnail = await sharp(buffer)
    .resize(400, 300, { fit: "cover" })
    .jpeg({ quality: 80 })
    .toBuffer();

  const thumbnailKey = s3Key.replace(/(\.\w+)$/, "_thumb.jpg");
  await uploadToS3(thumbnailKey, thumbnail, "image/jpeg");

  // Compute hashes for fraud detection
  const [perceptualHash, averageHash] = await Promise.all([
    computePerceptualHash(buffer),
    computeAverageHash(buffer),
  ]);

  // Get image metadata
  const metadata = await sharp(buffer).metadata();

  // Update database
  await prisma.listingImage.update({
    where: { id: imageId },
    data: {
      thumbnailUrl: `https://${S3_BUCKET_UPLOADS}.s3.amazonaws.com/${thumbnailKey}`,
      perceptualHash,
      averageHash,
      width: metadata.width ?? null,
      height: metadata.height ?? null,
      sizeBytes: buffer.length,
      mimeType: `image/${metadata.format ?? "jpeg"}`,
    },
  });

  return { imageId, thumbnailKey, perceptualHash };
}

export const imageProcessingWorker = new Worker<ImageJobData>(
  "image-processing",
  processImage,
  {
    connection: redis,
    concurrency: 5,
    limiter: { max: 10, duration: 60_000 },
  }
);

imageProcessingWorker.on("completed", (job) => {
  console.log(`[image-processing] Completed: ${job.id}`);
});

imageProcessingWorker.on("failed", (job, err) => {
  console.error(`[image-processing] Failed: ${job?.id}`, err.message);
});
