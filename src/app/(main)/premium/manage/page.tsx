import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatKRW, formatDateKR } from "@/lib/utils/format";
import { SUBSCRIPTION_TIER_LABELS, SUBSCRIPTION_PRICES } from "@/lib/utils/constants";

export const metadata = { title: "구독 관리" };

export default async function PremiumManagePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const subscription = await prisma.subscription.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-navy">구독 관리</h1>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        {subscription ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500">현재 플랜</p>
              <p className="mt-1 text-xl font-bold text-navy">
                {SUBSCRIPTION_TIER_LABELS[subscription.tier] ?? subscription.tier}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-500">월 결제액</p>
                <p className="mt-1 font-medium">{formatKRW(SUBSCRIPTION_PRICES[subscription.tier] ?? 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">다음 결제일</p>
                <p className="mt-1 font-medium">{subscription.currentPeriodEnd ? formatDateKR(subscription.currentPeriodEnd) : "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">구독 시작일</p>
                <p className="mt-1 font-medium">{subscription.currentPeriodStart ? formatDateKR(subscription.currentPeriodStart) : "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">상태</p>
                <span className="mt-1 inline-block rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  활성
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-gray-500">활성 구독이 없습니다.</p>
            <Link href="/premium/checkout" className="mt-4 inline-block rounded-lg bg-mint px-6 py-3 text-sm font-medium text-white hover:bg-mint-dark">
              프리미엄 구독하기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
