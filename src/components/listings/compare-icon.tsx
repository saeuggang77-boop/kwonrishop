"use client";

import Link from "next/link";
import { Scale } from "lucide-react";
import { useCompare } from "@/lib/compare-context";

export function CompareIcon() {
  const { items } = useCompare();

  return (
    <Link
      href="/listings/compare"
      className="relative flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-navy"
      title="매물 비교"
    >
      <Scale className="h-5 w-5" />
      {items.length > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-navy px-1 text-[10px] font-bold text-white">
          {items.length}
        </span>
      )}
    </Link>
  );
}
