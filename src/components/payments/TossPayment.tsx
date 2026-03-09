"use client";

import { useEffect, useRef, useState } from "react";

interface TossPaymentProps {
  orderId: string;
  amount: number;
  orderName: string;
  customerName: string;
}

declare global {
  interface Window {
    TossPayments: any;
  }
}

export default function TossPayment({
  orderId,
  amount,
  orderName,
  customerName,
}: TossPaymentProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const widgetsRef = useRef<any>(null);

  useEffect(() => {
    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

    if (!clientKey) {
      setError("결제 시스템이 설정되지 않았습니다.");
      setLoading(false);
      return;
    }

    async function loadTossPayments() {
      try {
        // Load Toss Payments Widget SDK
        if (!window.TossPayments) {
          const script = document.createElement("script");
          script.src = "https://js.tosspayments.com/v2/standard";
          script.async = true;

          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        const tossPayments = window.TossPayments(clientKey);
        const widgets = tossPayments.widgets({
          customerKey: `customer_${orderId}`,
        });

        await widgets.setAmount({ currency: "KRW", value: amount });

        await Promise.all([
          widgets.renderPaymentMethods({
            selector: "#toss-payment-method",
            variantKey: "DEFAULT",
          }),
          widgets.renderAgreement({
            selector: "#toss-agreement",
            variantKey: "AGREEMENT",
          }),
        ]);

        widgetsRef.current = widgets;
        setLoading(false);
      } catch (err) {
        console.error("Toss Payments loading error:", err);
        setError("결제 위젯을 불러오는데 실패했습니다.");
        setLoading(false);
      }
    }

    loadTossPayments();
  }, [orderId, amount]);

  async function handlePayment() {
    if (!widgetsRef.current) {
      alert("결제 위젯이 준비되지 않았습니다.");
      return;
    }

    try {
      await widgetsRef.current.requestPayment({
        orderId,
        orderName,
        successUrl: `${window.location.origin}/payments/success`,
        failUrl: `${window.location.origin}/payments/fail`,
        customerName,
      });
    } catch (err: any) {
      console.error("Payment request error:", err);
      if (err.code !== "USER_CANCEL") {
        alert("결제 요청에 실패했습니다.");
      }
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded" />
          <div className="h-12 bg-gray-200 rounded" />
          <div className="h-12 bg-gray-200 rounded" />
        </div>
        <p className="text-center text-gray-500 mt-4 text-sm">
          결제 정보를 불러오는 중...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-md mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
        <h3 className="font-bold text-gray-900 mb-4">주문 정보</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">상품명</span>
            <span className="font-medium text-gray-900">{orderName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">주문번호</span>
            <span className="font-medium text-gray-900 text-xs">{orderId}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-100">
            <span className="text-gray-900 font-medium">결제 금액</span>
            <span className="font-bold text-blue-600 text-lg">
              {amount.toLocaleString()}원
            </span>
          </div>
        </div>
      </div>

      {/* 결제 수단 선택 */}
      <div id="toss-payment-method" className="mb-4" />

      {/* 약관 동의 */}
      <div id="toss-agreement" className="mb-4" />

      <button
        onClick={handlePayment}
        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
      >
        결제하기
      </button>

      <p className="text-xs text-gray-500 text-center mt-4">
        토스페이먼츠를 통한 안전한 결제입니다
      </p>
    </div>
  );
}
