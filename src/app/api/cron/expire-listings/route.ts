import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { listingExpiredEmail } from "@/lib/email-templates";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json({ error: "Cron not configured" }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find listings that should be expired
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const expiredListings = await prisma.listing.findMany({
      where: {
        status: "ACTIVE",
        createdAt: {
          lt: thirtyDaysAgo,
        },
        OR: [
          { expiresAt: null },
          { expiresAt: { lt: new Date() } },
        ],
      },
      select: {
        id: true,
        userId: true,
        storeName: true,
        addressRoad: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    // Update listings to EXPIRED
    if (expiredListings.length > 0) {
      await prisma.listing.updateMany({
        where: {
          id: {
            in: expiredListings.map((l: any) => l.id),
          },
        },
        data: {
          status: "EXPIRED",
        },
      });

      // Create notifications for owners
      const notifications = expiredListings.map((listing: any) => ({
        userId: listing.userId,
        type: "LISTING_EXPIRED",
        title: "매물이 만료되었습니다",
        message: `${listing.storeName || listing.addressRoad || "매물"}이(가) 만료되었습니다. 연장하려면 클릭하세요.`,
        link: `/listings/${listing.id}`,
      }));

      await prisma.notification.createMany({
        data: notifications,
      });

      // 매물 소유자에게 만료 이메일 전송 (비차단)
      expiredListings.forEach((listing: any) => {
        if (listing.user.email) {
          (async () => {
            try {
              const storeName = listing.storeName || listing.addressRoad || "매물";
              const { subject, html } = listingExpiredEmail(
                listing.user.name || "회원",
                storeName
              );
              await sendEmail(listing.user.email, subject, html);
            } catch (error) {
              console.error("[Email] Failed to send expiration email:", error);
            }
          })();
        }
      });

      console.log(`Expired ${expiredListings.length} listings`);
    }

    return NextResponse.json({
      success: true,
      expiredCount: expiredListings.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
