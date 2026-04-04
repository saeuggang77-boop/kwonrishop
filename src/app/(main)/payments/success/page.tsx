"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [confirming, setConfirming] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const confirmedRef = useRef(false);

  useEffect(() => {
    // 중복 실행 방지 (StrictMode, 새로고침 등)
    if (confirmedRef.current) return;
    confirmedRef.current = true;

    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");

    if (!paymentKey || !orderId || !amount) {
      setError("결제 정보가 올바르지 않습니다.");
      setConfirming(false);
      return;
    }

    async function confirmPayment() {
      try {
        const res = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: parseInt(amount || "0"),
          }),
        });

        const data = await res.json();

        if (res.ok) {
          setOrderInfo(data);
        } else if (res.status === 409) {
          // 이미 처리된 주문 (새로고침 등) → 성공으로 처리
          setOrderInfo({ alreadyProcessed: true });
        } else {
          setError(data.error || "결제 승인에 실패했습니다.");
        }
      } catch (err) {
        console.error("Payment confirmation error:", err);
        setError("결제 승인 중 오류가 발생했습니다.");
      } finally {
        setConfirming(false);
      }
    }

    confirmPayment();
  }, [searchParams]);

  if (confirming) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4" />
          <p className="text-gray-600">결제를 확인하는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">결제 승인 실패</h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <p className="text-xs text-gray-500 mb-6">
            결제가 이미 완료되었다면 마이페이지에서 확인해주세요.
          </p>
          <div className="flex gap-3">
            <Link
              href="/mypage"
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              마이페이지 확인
            </Link>
            <Link
              href="/pricing"
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
            >
              다시 시도
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">결제가 완료되었습니다</h1>
        <p className="text-gray-600 mb-6">
          {orderInfo?.alreadyProcessed
            ? "이미 정상적으로 처리된 결제입니다"
            : "주문이 정상적으로 처리되었습니다"}
        </p>

        {orderInfo && !orderInfo.alreadyProcessed && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">상품명</span>
                <span className="font-medium text-gray-900">
                  {orderInfo.productName}
                </span>
              </div>
              {orderInfo.supplyPrice && orderInfo.vatAmount ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">공급가액</span>
                    <span className="text-gray-900">
                      {orderInfo.supplyPrice.toLocaleString()}원
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">부가세(10%)</span>
                    <span className="text-gray-900">
                      {orderInfo.vatAmount.toLocaleString()}원
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-900 font-bold">총 결제금액</span>
                    <span className="font-bold text-blue-600">
                      {orderInfo.amount.toLocaleString()}원
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="text-gray-600">결제 금액</span>
                  <span className="font-bold text-blue-600">
                    {orderInfo.amount.toLocaleString()}원
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <span className="text-gray-600">주문번호</span>
                <span className="font-medium text-gray-900 text-xs">
                  {orderInfo.orderId}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href="/mypage"
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            마이페이지
          </Link>
          <Link
            href="/listings"
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4" />
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
