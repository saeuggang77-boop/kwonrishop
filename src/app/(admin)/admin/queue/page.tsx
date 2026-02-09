import Link from "next/link";
import { Shield, ChevronRight, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDateTimeKR } from "@/lib/utils/format";
import { FRAUD_SEVERITY_LABELS } from "@/lib/utils/constants";

export const metadata = { title: "사기탐지 큐" };

export default async function FraudQueuePage() {
  const violations = await prisma.fraudViolation.findMany({
    where: {
      OR: [
        { severity: { in: ["HIGH", "CRITICAL"] } },
        { status: "PENDING" },
      ],
    },
    include: {
      listing: { select: { id: true, title: true, city: true, district: true } },
      rule: { select: { name: true, ruleType: true } },
    },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  const pendingCount = violations.filter((v) => v.status === "PENDING").length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">사기탐지 큐</h1>
          <p className="mt-1 text-sm text-gray-500">
            심각도 HIGH 이상 또는 대기 상태 위반 {pendingCount}건
          </p>
        </div>
      </div>

      {violations.length === 0 ? (
        <div className="mt-12 rounded-xl border border-gray-200 bg-white py-16 text-center">
          <Shield className="mx-auto h-12 w-12 text-green-400" />
          <p className="mt-4 text-lg font-medium text-gray-500">대기 중인 위반이 없습니다</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {violations.map((v) => (
            <Link
              key={v.id}
              href={`/admin/queue/${v.id}`}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 transition hover:shadow-sm"
            >
              <div className="flex items-start gap-4">
                <SeverityIcon severity={v.severity} />
                <div>
                  <p className="font-medium text-navy">{v.listing.title}</p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {v.rule.name} &middot; {v.listing.city} {v.listing.district}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDateTimeKR(v.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={v.status} />
                <SeverityBadge severity={v.severity} />
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function SeverityIcon({ severity }: { severity: string }) {
  const color = severity === "CRITICAL" || severity === "HIGH" ? "text-red-500" : "text-yellow-500";
  return (
    <div className={`mt-0.5 rounded-lg bg-red-50 p-2 ${color}`}>
      <AlertTriangle className="h-5 w-5" />
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    CRITICAL: "bg-red-100 text-red-700",
    HIGH: "bg-orange-100 text-orange-700",
    MEDIUM: "bg-yellow-100 text-yellow-700",
    LOW: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[severity] ?? colors.LOW}`}>
      {FRAUD_SEVERITY_LABELS[severity] ?? severity}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-50 text-yellow-700",
    CONFIRMED: "bg-red-50 text-red-700",
    DISMISSED: "bg-green-50 text-green-700",
  };
  const labels: Record<string, string> = {
    PENDING: "대기",
    CONFIRMED: "확인됨",
    DISMISSED: "해제",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] ?? "bg-gray-100"}`}>
      {labels[status] ?? status}
    </span>
  );
}
