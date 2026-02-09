import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatDateTimeKR, formatKRW } from "@/lib/utils/format";
import { FRAUD_SEVERITY_LABELS, RIGHTS_CATEGORY_LABELS, LISTING_STATUS_LABELS } from "@/lib/utils/constants";
import { ViolationActions } from "./actions";

export const metadata = { title: "위반 상세" };

export default async function ViolationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const violation = await prisma.fraudViolation.findUnique({
    where: { id },
  });

  if (!violation) notFound();

  const [listing, rule] = await Promise.all([
    prisma.listing.findUnique({
      where: { id: violation.listingId },
    }),
    prisma.fraudRule.findUnique({
      where: { id: violation.ruleId },
    }),
  ]);

  if (!listing) notFound();

  const seller = await prisma.user.findUnique({
    where: { id: listing.sellerId },
    select: { id: true, name: true, email: true },
  });

  // Previous violations for this seller
  const sellerViolations = await prisma.fraudViolation.count({
    where: {
      listing: { sellerId: listing.sellerId },
      id: { not: violation.id },
    },
  });

  const details = violation.details as Record<string, unknown> | null;

  return (
    <div>
      <Link href="/admin/queue" className="flex items-center gap-1 text-sm text-gray-500 hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> 사기탐지 큐로 돌아가기
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Violation Info */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-navy">위반 상세</h1>
                <p className="mt-1 text-sm text-gray-500">ID: {violation.id}</p>
              </div>
              <div className="flex gap-2">
                <SeverityBadge severity={violation.severity} />
                <StatusBadge status={violation.status} />
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoRow label="탐지 규칙" value={rule?.name ?? violation.ruleId} />
              <InfoRow label="규칙 유형" value={rule?.ruleType ?? "-"} />
              <InfoRow label="탐지 일시" value={formatDateTimeKR(violation.createdAt)} />
              <InfoRow label="심각도" value={FRAUD_SEVERITY_LABELS[violation.severity] ?? violation.severity} />
            </div>

            {details && Object.keys(details).length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700">탐지 상세</h3>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-600">
                  {JSON.stringify(details, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Listing Info */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-bold text-navy">매물 정보</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <InfoRow label="매물명" value={listing.title} />
              <InfoRow label="가격" value={formatKRW(listing.price)} />
              <InfoRow label="권리유형" value={RIGHTS_CATEGORY_LABELS[listing.rightsCategory] ?? listing.rightsCategory} />
              <InfoRow label="매물 상태" value={LISTING_STATUS_LABELS[listing.status] ?? listing.status} />
              <InfoRow label="주소" value={`${listing.city} ${listing.district} ${listing.address}`} />
              <InfoRow label="등록일" value={formatDateTimeKR(listing.createdAt)} />
            </div>
            <div className="mt-4">
              <Link href={`/listings/${listing.id}`} className="text-sm text-mint hover:underline">
                매물 상세 보기 →
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          {/* Actions */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="font-bold text-navy">조치</h3>
            {violation.status === "PENDING" ? (
              <ViolationActions violationId={violation.id} listingId={listing.id} />
            ) : (
              <p className="mt-3 text-sm text-gray-500">
                이미 처리된 위반입니다. ({violation.status === "APPROVED" ? "정상 처리" : violation.status === "REJECTED" ? "위반 확인" : "검토됨"})
              </p>
            )}
          </div>

          {/* Seller Info */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="font-bold text-navy">판매자 정보</h3>
            <div className="mt-3 space-y-2 text-sm">
              <InfoRow label="이름" value={seller?.name ?? "미인증"} />
              <InfoRow label="이메일" value={seller?.email ?? "-"} />
              <InfoRow label="이전 위반 횟수" value={`${sellerViolations}건`} />
            </div>
            {sellerViolations >= 2 && (
              <div className="mt-3 flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                <AlertTriangle className="h-3.5 w-3.5" />
                반복 위반자 — 계정 검토 권장
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-navy">{value}</p>
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
  const map: Record<string, { color: string; label: string }> = {
    PENDING: { color: "bg-yellow-50 text-yellow-700", label: "대기" },
    REVIEWED: { color: "bg-blue-50 text-blue-700", label: "검토됨" },
    APPROVED: { color: "bg-green-50 text-green-700", label: "정상 처리" },
    REJECTED: { color: "bg-red-50 text-red-700", label: "위반 확인" },
  };
  const { color, label } = map[status] ?? { color: "bg-gray-100", label: status };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>{label}</span>;
}
