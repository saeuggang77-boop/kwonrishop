"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TossPayment from "@/components/payments/TossPayment";

function CheckoutContent() {
  const searchParams = useSearchParams();

  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const orderName = searchParams.get("orderName");
  const customerName = searchParams.get("customerName");

  if (!orderId || !amount || !orderName || !customerName) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700">결제 정보가 올바르지 않습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        결제하기
      </h1>

      <TossPayment
        orderId={orderId}
        amount={parseInt(amount)}
        orderName={orderName}
        customerName={customerName}
      />
    </div>
  );
}

export default function CheckoutPage() {
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
      <CheckoutContent />
    </Suspense>
  );
}
