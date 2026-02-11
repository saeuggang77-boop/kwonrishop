"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Check, EyeOff, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function ListingActions({
  listingId,
  currentStatus,
}: {
  listingId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: string) => {
    if (
      !confirm(
        `정말 이 매물을 ${
          action === "APPROVE"
            ? "승인"
            : action === "HIDE"
            ? "숨김"
            : "삭제"
        }하시겠습니까?`
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/listings/${listingId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error("Failed to perform action");
      }

      router.refresh();
      setIsOpen(false);
    } catch {
      toast("error", "작업에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded hover:bg-gray-100 transition-colors"
        disabled={isLoading}
      >
        <MoreVertical className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            {currentStatus !== "ACTIVE" && (
              <button
                onClick={() => handleAction("APPROVE")}
                disabled={isLoading}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4 text-green-600" />
                승인
              </button>
            )}
            {currentStatus !== "HIDDEN" && (
              <button
                onClick={() => handleAction("HIDE")}
                disabled={isLoading}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
              >
                <EyeOff className="w-4 h-4 text-gray-600" />
                숨김
              </button>
            )}
            {currentStatus !== "DELETED" && (
              <button
                onClick={() => handleAction("DELETE")}
                disabled={isLoading}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                삭제
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
