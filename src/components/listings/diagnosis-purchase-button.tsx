"use client";

import { useState } from "react";
import { Shield, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface DiagnosisPurchaseButtonProps {
  listingId: string;
}

export function DiagnosisPurchaseButton({ listingId }: DiagnosisPurchaseButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handlePurchase = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/diagnosis/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? "진단서 발급에 실패했습니다.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 overflow-hidden rounded-xl border-2 border-purple-300 bg-gradient-to-r from-purple-50 via-white to-purple-50">
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
            <Shield className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="font-bold text-purple-900">
              권리진단서 발급하기
            </p>
            <p className="mt-0.5 text-sm text-gray-600">
              상단 노출 30일 + 적정가 인증 + 매수인 문의율 3배
            </p>
          </div>
        </div>
        <button
          onClick={handlePurchase}
          disabled={loading}
          className="shrink-0 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              발급 중...
            </span>
          ) : (
            "30,000원 발급"
          )}
        </button>
      </div>
      {error && (
        <div className="border-t border-purple-200 px-6 py-3">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}
    </div>
  );
}
