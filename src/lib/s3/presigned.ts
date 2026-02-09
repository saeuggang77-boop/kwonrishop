import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, S3_BUCKET_UPLOADS, S3_BUCKET_REPORTS } from "./client";

export async function getUploadPresignedUrl(
  key: string,
  contentType: string,
  expiresIn = 600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_UPLOADS,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function getDownloadPresignedUrl(
  key: string,
  bucket: "uploads" | "reports" = "uploads",
  expiresIn = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket === "uploads" ? S3_BUCKET_UPLOADS : S3_BUCKET_REPORTS,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}
