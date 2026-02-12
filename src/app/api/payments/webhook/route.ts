import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/toss/webhook";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    try {
      const limited = await checkRateLimit(`payment-webhook:${ip}`, 30, 60);
      if (limited) return limited;
    } catch {}

    const body = await req.text();
    const signature = req.headers.get("toss-signature") ?? "";

    if (!verifyWebhookSignature(body, signature)) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    switch (event.eventType) {
      case "PAYMENT_STATUS_CHANGED": {
        const { paymentKey, status } = event.data;

        const statusMap: Record<string, string> = {
          DONE: "APPROVED",
          CANCELED: "CANCELLED",
          PARTIAL_CANCELED: "PARTIAL_REFUND",
          ABORTED: "FAILED",
          EXPIRED: "FAILED",
        };

        const mappedStatus = statusMap[status];
        if (mappedStatus && paymentKey) {
          // Idempotency check: skip if already processed
          const existingPayment = await prisma.payment.findFirst({
            where: { tossPaymentKey: paymentKey },
            select: { paymentStatus: true },
          });
          if (!existingPayment || existingPayment.paymentStatus === mappedStatus) {
            break; // Already processed or not found
          }

          await prisma.payment.updateMany({
            where: { tossPaymentKey: paymentKey },
            data: {
              paymentStatus: mappedStatus as "APPROVED" | "CANCELLED" | "PARTIAL_REFUND" | "FAILED",
              ...(status === "CANCELED" ? { refundedAt: new Date() } : {}),
              ...(["ABORTED", "EXPIRED"].includes(status) ? { failedAt: new Date(), failReason: status } : {}),
            },
          });
        }
        break;
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return Response.json({ success: false, error: "Internal processing error" });
  }
}
