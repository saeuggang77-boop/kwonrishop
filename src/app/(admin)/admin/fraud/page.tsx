import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils/format";
import { FRAUD_SEVERITY_LABELS } from "@/lib/utils/constants";
import { Shield } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "사기탐지 규칙" };

export default async function AdminFraudPage() {
  const rules = await prisma.fraudRule.findMany({
    orderBy: { ruleType: "asc" },
  });

  const violationCounts = await prisma.fraudViolation.groupBy({
    by: ["ruleId"],
    _count: true,
  });
  const countMap = new Map(violationCounts.map((v) => [v.ruleId, v._count]));

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">사기탐지 규칙</h1>
      <p className="mt-1 text-sm text-gray-500">{rules.length}개 규칙 활성</p>

      <div className="mt-6 space-y-4">
        {rules.map((rule) => (
          <div key={rule.id} className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-5 w-5 text-navy" />
                <div>
                  <h3 className="font-bold text-navy">{rule.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{rule.description}</p>
                  <div className="mt-2 flex gap-3 text-xs text-gray-400">
                    <span>유형: {rule.ruleType}</span>
                    <span>심각도: {FRAUD_SEVERITY_LABELS[rule.severity] ?? rule.severity}</span>
                    <span>탐지 건수: {formatNumber(countMap.get(rule.id) ?? 0)}</span>
                  </div>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${rule.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {rule.isActive ? "활성" : "비활성"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Link href="/admin/queue" className="text-sm text-navy hover:underline">사기탐지 큐 보기 →</Link>
      </div>
    </div>
  );
}
