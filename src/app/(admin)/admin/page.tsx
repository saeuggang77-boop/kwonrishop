import { Users, Package, AlertTriangle, DollarSign } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils/format";

export const metadata = { title: "관리자 대시보드" };

export default async function AdminDashboardPage() {
  const [userCount, listingCount, violationCount, pendingCount] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count(),
    prisma.fraudViolation.count({ where: { status: "PENDING" } }),
    prisma.listing.count({ where: { status: "PENDING_VERIFICATION" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">관리자 대시보드</h1>
      <p className="mt-1 text-sm text-gray-500">권리샵 플랫폼 현황</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5 text-blue-500" />} label="총 회원" value={formatNumber(userCount)} />
        <StatCard icon={<Package className="h-5 w-5 text-mint" />} label="총 매물" value={formatNumber(listingCount)} />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          label="대기 위반"
          value={formatNumber(violationCount)}
          urgent={violationCount > 0}
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5 text-orange-500" />}
          label="검증 대기 매물"
          value={formatNumber(pendingCount)}
          urgent={pendingCount > 0}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  urgent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  urgent?: boolean;
}) {
  return (
    <div className={`rounded-xl border bg-white p-5 ${urgent ? "border-red-200" : "border-gray-200"}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        {icon}
      </div>
      <p className={`mt-2 text-2xl font-bold ${urgent ? "text-red-600" : "text-navy"}`}>{value}</p>
    </div>
  );
}
