import { tossRequest } from "./client";

interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  method: string;
  card?: {
    company: string;
    number: string;
    receiptUrl: string;
  };
  receipt?: {
    url: string;
  };
  approvedAt: string;
  failure?: {
    code: string;
    message: string;
  };
}

export async function confirmPayment(params: {
  paymentKey: string;
  orderId: string;
  amount: number;
}): Promise<TossPaymentResponse> {
  return tossRequest<TossPaymentResponse>("/payments/confirm", {
    method: "POST",
    body: params,
  });
}

export async function cancelPayment(params: {
  paymentKey: string;
  cancelReason: string;
  cancelAmount?: number;
}): Promise<TossPaymentResponse> {
  return tossRequest<TossPaymentResponse>(
    `/payments/${params.paymentKey}/cancel`,
    {
      method: "POST",
      body: {
        cancelReason: params.cancelReason,
        ...(params.cancelAmount ? { cancelAmount: params.cancelAmount } : {}),
      },
    }
  );
}
