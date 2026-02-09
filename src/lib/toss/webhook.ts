import { createHmac } from "crypto";

/**
 * TossPayments 웹훅 서명 검증
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const secret = process.env.TOSS_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("TOSS_WEBHOOK_SECRET not configured, skipping verification");
    return true;
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(body)
    .digest("base64");

  return signature === expectedSignature;
}
