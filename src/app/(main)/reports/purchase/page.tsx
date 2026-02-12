"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";
import { formatKRW } from "@/lib/utils/format";
import { REPORT_PLANS } from "@/lib/utils/constants";
import { useToast } from "@/components/ui/toast";

function ReportPurchaseContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId");
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    if (!listingId) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/reports/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      if (res.ok) {
        router.push("/dashboard/reports");
      } else {
        toast("error", "구매에 실패했습니다.");
      }
    } catch {
      toast("error", "서버 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <FileText className="mx-auto h-16 w-16 text-navy" />
      <h1 className="mt-6 text-2xl font-bold text-navy">권리진단서 발급</h1>
      <p className="mt-2 text-gray-500">
        전문가 수준의 권리진단서를 PDF로 받아보세요.
      </p>
      <div className="mt-6 rounded-lg bg-gray-50 p-4">
        <p className="text-3xl font-bold text-navy">{formatKRW(REPORT_PLANS[0].price)}</p>
        <p className="text-xs text-gray-500">1회 결제</p>
      </div>
      <ul className="mt-6 space-y-2 text-left text-sm text-gray-600">
        <li>- 권리 관계 상세 분석</li>
        <li>- 주변 시세 비교 데이터</li>
        <li>- 위험 요소 평가</li>
        <li>- PDF 다운로드 + 이메일 발송</li>
      </ul>
      <button
        onClick={handlePurchase}
        disabled={isLoading || !listingId}
        className="mt-8 w-full rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-50"
      >
        {isLoading ? "처리 중..." : "결제하기"}
      </button>
    </div>
  );
}

export default function ReportPurchasePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-16 animate-pulse"><div className="h-64 rounded-lg bg-gray-200" /></div>}>
      <ReportPurchaseContent />
    </Suspense>
  );
}
