import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPaymentSchema } from "@/lib/validators/payment";
import { errorToResponse } from "@/lib/utils/errors";
import { REPORT_PLANS, PREMIUM_AD_PLANS } from "@/lib/utils/constants";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: { message: "인증이 필요합니다." } }, { status: 401 });
    }

    try {
      const limited = await checkRateLimit(`payment-create:${session.user.id}`, 10, 60);
      if (limited) return limited;
    } catch {}

    const body = await req.json();
    const { paymentType, tier, listingId, reportPlanId } = createPaymentSchema.parse(body);

    let amount: number;
    let orderName: string;
    const metadata: Record<string, string> = {};

    switch (paymentType) {
      case "PREMIUM_SUBSCRIPTION": {
        // 구독 시스템 비활성화됨
        return Response.json({ error: { message: "구독 시스템이 종료되었습니다. 광고 또는 권리진단서를 이용해주세요." } }, { status: 400 });
      }
      case "DEEP_REPORT": {
        if (!listingId) {
          return Response.json({ error: { message: "매물 ID가 필요합니다." } }, { status: 400 });
        }
        if (reportPlanId) {
          const plan = await prisma.reportPlan.findUnique({ where: { id: reportPlanId } });
          if (!plan) {
            return Response.json({ error: { message: "권리진단서 플랜을 찾을 수 없습니다." } }, { status: 404 });
          }
          amount = Number(plan.price);
        } else {
          amount = REPORT_PLANS[0].price;
        }
        orderName = "권리진단서";
        metadata.listingId = listingId;
        if (reportPlanId) metadata.reportPlanId = reportPlanId;
        break;
      }
      case "ADVERTISEMENT":
      case "FEATURED_LISTING": {
        if (!listingId) {
          return Response.json({ error: { message: "매물 ID가 필요합니다." } }, { status: 400 });
        }
        const adPlan = PREMIUM_AD_PLANS.find((p) => p.tier === tier);
        if (!adPlan) {
          return Response.json({ error: { message: "유효하지 않은 광고 플랜입니다." } }, { status: 400 });
        }
        amount = adPlan.price;
        orderName = adPlan.tier === "VIP" ? "프리미엄 매물 광고" : "오늘의 추천 매물 광고";
        metadata.listingId = listingId;
        metadata.tier = adPlan.tier;
        break;
      }
      default:
        return Response.json({ error: { message: "유효하지 않은 결제 타입입니다." } }, { status: 400 });
    }

    const orderId = `${paymentType.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await prisma.payment.create({
      data: {
        userId: session.user.id,
        orderId,
        amount: BigInt(amount),
        paymentType,
        paymentStatus: "PENDING",
        tossOrderName: orderName,
        metadata,
      },
    });

    return Response.json({ data: { orderId, amount, orderName } });
  } catch (error) {
    return errorToResponse(error);
  }
}
