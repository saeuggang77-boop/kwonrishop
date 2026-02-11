"use client";

import Link from "next/link";
import { XCircle } from "lucide-react";

export default function ListingAdFailPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <XCircle className="mx-auto h-16 w-16 text-red-500" />
      <h1 className="mt-6 text-2xl font-bold text-navy">결제에 실패했습니다</h1>
      <p className="mt-2 text-gray-500">
        결제 처리 중 문제가 발생했습니다. 다시 시도해주세요.
      </p>
      <div className="mt-8">
        <Link
          href="/premium/listing-ad"
          className="rounded-lg bg-mint px-6 py-3 text-sm font-medium text-white hover:bg-mint-dark"
        >
          다시 시도
        </Link>
      </div>
    </div>
  );
}
