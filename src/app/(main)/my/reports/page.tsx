"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Download, Eye, Clock, CheckCircle } from "lucide-react";
import { formatKRW } from "@/lib/utils/format";
import { BUSINESS_CATEGORY_LABELS } from "@/lib/utils/constants";

interface ReportPurchaseItem {
  id: string;
  status: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    address: string;
    businessCategory: string;
  };
  plan: {
    name: string;
    displayName: string;
    price: number;
  };
  data: { id: string; pdfUrl: string | null } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDING: { label: "신청중", color: "text-yellow-700", bg: "bg-yellow-100", icon: <Clock className="h-3.5 w-3.5" /> },
  PAID: { label: "결제완료", color: "text-blue-700", bg: "bg-blue-100", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  COMPLETED: { label: "분석완료", color: "text-green-700", bg: "bg-green-100", icon: <CheckCircle className="h-3.5 w-3.5" /> },
};

export default function MyReportsPage() {
  const [purchases, setPurchases] = useState<ReportPurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/report-purchases")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setPurchases(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">내 권리진단서</h1>
          <p className="mt-1 text-sm text-gray-500">발급받은 권리진단서를 확인하세요</p>
        </div>
        <Link
          href="/listings"
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-dark"
        >
          매물 둘러보기
        </Link>
      </div>

      {loading ? (
        <div className="mt-12 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : purchases.length === 0 ? (
        <div className="mt-20 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-600">발급받은 권리진단서가 없습니다</h3>
          <p className="mt-2 text-sm text-gray-500">매물 상세 페이지에서 권리진단서를 발급받아보세요</p>
          <Link
            href="/listings"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            매물 목록 보기
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {purchases.map((purchase) => {
            const statusCfg = STATUS_CONFIG[purchase.status] ?? STATUS_CONFIG.PENDING;
            const isPremium = purchase.plan.name === "PREMIUM";
            const date = new Date(purchase.createdAt);

            return (
              <div
                key={purchase.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between p-5">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{purchase.listing.title}</h3>
                      <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                        isPremium ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {purchase.plan.displayName}
                      </span>
                      <span className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-sm text-gray-500">
                      <span>{purchase.listing.address}</span>
                      <span>{BUSINESS_CATEGORY_LABELS[purchase.listing.businessCategory] ?? purchase.listing.businessCategory}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                      <span>{date.toLocaleDateString("ko-KR")} 신청</span>
                      <span>{formatKRW(purchase.plan.price)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {purchase.status === "COMPLETED" && (
                      <Link
                        href={`/reports/${purchase.id}`}
                        className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
                      >
                        <Eye className="h-4 w-4" />
                        진단서 보기
                      </Link>
                    )}
                    {purchase.status === "COMPLETED" && isPremium && purchase.data?.pdfUrl && (
                      <button
                        onClick={() => window.open(purchase.data!.pdfUrl!, "_blank")}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Download className="h-4 w-4" />
                        PDF
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
