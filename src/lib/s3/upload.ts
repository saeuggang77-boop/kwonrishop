import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, S3_BUCKET_UPLOADS, S3_BUCKET_REPORTS } from "./client";

export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string,
  bucket: "uploads" | "reports" = "uploads"
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: bucket === "uploads" ? S3_BUCKET_UPLOADS : S3_BUCKET_REPORTS,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  await s3Client.send(command);
}

export async function deleteFromS3(
  key: string,
  bucket: "uploads" | "reports" = "uploads"
): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucket === "uploads" ? S3_BUCKET_UPLOADS : S3_BUCKET_REPORTS,
    Key: key,
  });
  await s3Client.send(command);
}
