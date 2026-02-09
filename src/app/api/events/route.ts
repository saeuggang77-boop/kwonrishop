import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod/v4";
import type { Prisma } from "@prisma/client";

const trackEventSchema = z.object({
  eventType: z.enum([
    "VIEW_LISTING", "CLICK_CTA", "INQUIRY_SENT", "PURCHASE_PREMIUM",
    "UPLOAD_DOCUMENT", "DOWNLOAD_REPORT", "SEARCH_PERFORMED",
    "LISTING_CREATED", "LISTING_UPDATED", "PAYMENT_COMPLETED",
  ]),
  listingId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  sessionId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const parsed = trackEventSchema.parse(body);

    await prisma.event.create({
      data: {
        userId: session?.user?.id,
        listingId: parsed.listingId,
        eventType: parsed.eventType,
        metadata: (parsed.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        sessionId: parsed.sessionId,
        ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0],
        userAgent: req.headers.get("user-agent"),
        referrer: req.headers.get("referer"),
      },
    });

    return Response.json({ data: { success: true } });
  } catch {
    // Non-blocking: silently fail for event tracking
    return Response.json({ data: { success: true } });
  }
}
