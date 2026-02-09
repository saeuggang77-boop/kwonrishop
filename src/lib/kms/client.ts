import { KMSClient } from "@aws-sdk/client-kms";

export const kmsClient = new KMSClient({
  region: process.env.AWS_REGION || "ap-northeast-2",
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    : undefined,
});

export const KMS_KEY_ID = process.env.KMS_KEY_ID || "";
