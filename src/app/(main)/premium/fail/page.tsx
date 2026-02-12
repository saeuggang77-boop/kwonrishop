import Link from "next/link";
import { XCircle } from "lucide-react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "결제 실패 - 권리샵",
};

export default function PremiumFailPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <XCircle className="mx-auto h-16 w-16 text-red-500" />
      <h1 className="mt-6 text-2xl font-bold text-navy">결제에 실패했습니다</h1>
      <p className="mt-2 text-gray-500">잠시 후 다시 시도해주세요. 문제가 지속되면 고객센터에 문의해주세요.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/pricing" className="rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-dark">
          다시 시도
        </Link>
        <Link href="/" className="rounded-lg border border-gray-300 px-6 py-3 text-sm text-gray-600 hover:bg-gray-50">
          홈으로
        </Link>
      </div>
    </div>
  );
}
