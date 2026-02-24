"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface PaymentConfirmHandlerProps {
  listingId: string;
}

export function PaymentConfirmHandler({ listingId }: PaymentConfirmHandlerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const paymentStatus = searchParams.get("payment");

  const [status, setStatus] = useState<"confirming" | "success" | "error" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Handle payment failure
    if (paymentStatus === "fail") {
      setStatus("error");
      setErrorMsg("결제가 취소되었습니다.");
      return;
    }

    // Handle payment success - confirm with backend
    if (paymentStatus === "success" && paymentKey && orderId && amount) {
      setStatus("confirming");

      async function confirmPayment() {
        try {
          const res = await fetch("/api/payments/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentKey,
              orderId,
              amount: Number(amount),
            }),
          });

          if (res.ok) {
            setStatus("success");
            // Reload page after 2 seconds to show unlocked content
            setTimeout(() => {
              router.refresh();
              // Clear query params
              window.history.replaceState({}, "", `/listings/${listingId}`);
            }, 2000);
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
    }
  }, [paymentStatus, paymentKey, orderId, amount, router, listingId]);

  if (!status) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        {status === "confirming" && (
          <>
            <Loader2 className="mx-auto h-16 w-16 animate-spin text-navy" />
            <h2 className="mt-4 text-center text-xl font-bold text-navy">결제 확인 중...</h2>
            <p className="mt-2 text-center text-sm text-gray-500">잠시만 기다려주세요.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="mt-4 text-center text-xl font-bold text-navy">결제가 완료되었습니다!</h2>
            <p className="mt-2 text-center text-sm text-gray-500">
              이제 이 매물의 수익 데이터를 확인할 수 있습니다.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="mx-auto h-16 w-16 text-red-500" />
            <h2 className="mt-4 text-center text-xl font-bold text-navy">결제 실패</h2>
            <p className="mt-2 text-center text-sm text-gray-500">{errorMsg}</p>
            <button
              onClick={() => {
                setStatus(null);
                window.history.replaceState({}, "", `/listings/${listingId}`);
              }}
              className="mt-6 w-full rounded-lg bg-navy px-4 py-3 text-sm font-medium text-white hover:bg-navy/90"
            >
              확인
            </button>
          </>
        )}
      </div>
    </div>
  );
}
