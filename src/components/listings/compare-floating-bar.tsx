"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, Scale, Trash2 } from "lucide-react";
import { useCompare } from "@/lib/compare-context";
import { useSession } from "next-auth/react";

export function CompareFloatingBar() {
  const { items, remove, clear } = useCompare();
  const { data: session } = useSession();
  const router = useRouter();

  if (items.length === 0) return null;

  const handleCompare = () => {
    router.push("/listings/compare");
  };

  const userTier = (session?.user as { tier?: string } | undefined)?.tier;
  const isPro = userTier === "BASIC" || userTier === "PREMIUM" || userTier === "ENTERPRISE";

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 md:bottom-0">
      <div className="mx-auto max-w-3xl px-4 pb-4">
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-xl">
          {/* Items */}
          <div className="flex flex-1 items-center gap-2 overflow-x-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className="relative shrink-0"
              >
                <div className="h-12 w-12 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                  {item.thumbnail ? (
                    <Image
                      src={item.thumbnail}
                      alt={item.title}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-gray-400">
                      매물
                    </div>
                  )}
                </div>
                <button
                  onClick={() => remove(item.id)}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-white transition-colors hover:bg-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {/* Empty slots */}
            {Array.from({ length: 4 - items.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 sm:flex"
              >
                <Scale className="h-4 w-4 text-gray-300" />
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={clear}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title="전체 삭제"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleCompare}
              disabled={items.length < 2}
              className="flex items-center gap-2 rounded-xl bg-mint px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-mint-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Scale className="h-4 w-4" />
              <span className="hidden sm:inline">비교하기</span>
              <span className="sm:hidden">비교</span>
              {!isPro && (
                <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">PRO</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
