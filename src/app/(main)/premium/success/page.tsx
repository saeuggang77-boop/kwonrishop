"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

function PremiumSuccessContent() {
  const searchParams = useSearchParams();
  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const tier = searchParams.get("tier");

  const hasPaymentParams = !!(paymentKey && orderId && amount);
  const [status, setStatus] = useState<"confirming" | "success" | "error">(
    hasPaymentParams ? "confirming" : "success"
  );
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!hasPaymentParams) return;

    async function confirmPayment() {
      try {
        const res = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
            tier: tier ?? "PRO",
          }),
        });

        if (res.ok) {
          setStatus("success");
        } else {
          const data = await res.json();
          setErrorMsg(data.error?.message ?? "결제 확인에 실패했습니다.");
          setStatus("error");
        }
      } catch {
        setErrorMsg("서버 오류가 발생했습니다.");
        setStatus("error");
      }
    }

    confirmPayment();
  }, [hasPaymentParams, paymentKey, orderId, amount, tier]);

  if (status === "confirming") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Loader2 className="mx-auto h-16 w-16 animate-spin text-mint" />
        <h1 className="mt-6 text-2xl font-bold text-navy">결제 확인 중...</h1>
        <p className="mt-2 text-gray-500">잠시만 기다려주세요.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <XCircle className="mx-auto h-16 w-16 text-red-500" />
        <h1 className="mt-6 text-2xl font-bold text-navy">결제 확인 실패</h1>
        <p className="mt-2 text-gray-500">{errorMsg}</p>
        <div className="mt-8">
          <Link
            href="/premium/checkout"
            className="rounded-lg bg-mint px-6 py-3 text-sm font-medium text-white hover:bg-mint-dark"
          >
            다시 시도
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <CheckCircle className="mx-auto h-16 w-16 text-mint" />
      <h1 className="mt-6 text-2xl font-bold text-navy">구독이 완료되었습니다!</h1>
      <p className="mt-2 text-gray-500">프리미엄 기능을 이용하실 수 있습니다.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/listings"
          className="rounded-lg bg-mint px-6 py-3 text-sm font-medium text-white hover:bg-mint-dark"
        >
          매물 둘러보기
        </Link>
        <Link
          href="/premium/manage"
          className="rounded-lg border border-gray-300 px-6 py-3 text-sm text-gray-600 hover:bg-gray-50"
        >
          구독 관리
        </Link>
      </div>
    </div>
  );
}

export default function PremiumSuccessPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Loader2 className="mx-auto h-16 w-16 animate-spin text-mint" />
        <h1 className="mt-6 text-2xl font-bold text-navy">로딩 중...</h1>
      </div>
    }>
      <PremiumSuccessContent />
    </Suspense>
  );
}
