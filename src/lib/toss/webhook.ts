import { createHmac, timingSafeEqual } from "crypto";

/**
 * TossPayments 웹훅 서명 검증
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const secret = process.env.TOSS_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("TOSS_WEBHOOK_SECRET not configured, rejecting webhook");
    return false;
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(body)
    .digest("base64");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(sigBuffer, expectedBuffer);
}
