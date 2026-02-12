import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { purchaseReportSchema } from "@/lib/validators/payment";
import { errorToResponse, NotFoundError } from "@/lib/utils/errors";
import { REPORT_PLANS } from "@/lib/utils/constants";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: { message: "인증이 필요합니다." } }, { status: 401 });
    }

    const body = await req.json();
    const { listingId } = purchaseReportSchema.parse(body);

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, title: true },
    });

    if (!listing) throw new NotFoundError("매물을 찾을 수 없습니다.");

    const orderId = `KWR-${Date.now()}-${uuidv4().slice(0, 8)}`;

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        orderId,
        amount: BigInt(REPORT_PLANS[0].price),
        paymentType: "DEEP_REPORT",
        tossOrderName: `권리진단서 - ${listing.title}`,
      },
    });

    // Pre-create report record
    await prisma.report.create({
      data: {
        userId: session.user.id,
        listingId,
        paymentId: payment.id,
        status: "QUEUED",
      },
    });

    return Response.json({
      data: {
        orderId,
        amount: REPORT_PLANS[0].price,
        orderName: payment.tossOrderName,
        customerKey: session.user.id,
      },
    });
  } catch (error) {
    return errorToResponse(error);
  }
}
