import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // CRON 인증은 middleware.ts에서 처리
  const now = new Date();

  // 1. 만료된 점프업 리셋
  const expiredJumpUp = await prisma.listing.updateMany({
    where: { isJumpUp: true, jumpUpExpiresAt: { lte: now } },
    data: { isJumpUp: false, jumpUpExposureOrder: 0 },
  });

  // 2. 만료된 급매 리셋
  const expiredUrgent = await prisma.listing.updateMany({
    where: { isUrgent: true, urgentExpiresAt: { lte: now } },
    data: { isUrgent: false },
  });

  // 3. 만료된 PaidService 상태 업데이트
  const expiredServices = await prisma.paidService.updateMany({
    where: { status: "ACTIVE", endDate: { lte: now } },
    data: { status: "EXPIRED" },
  });

  return Response.json({
    ok: true,
    expired: {
      jumpUp: expiredJumpUp.count,
      urgent: expiredUrgent.count,
      services: expiredServices.count,
    },
  });
}
