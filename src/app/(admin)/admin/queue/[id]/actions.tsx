"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function ViolationActions({
  violationId,
}: {
  violationId: string;
  listingId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [note, setNote] = useState("");

  const handleAction = async (action: "APPROVE" | "REJECT" | "REQUEST_MORE_INFO") => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/queue/${violationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });

      if (res.ok) {
        router.push("/admin/queue");
        router.refresh();
      } else {
        const data = await res.json();
        toast("error", data.error?.message ?? "처리에 실패했습니다.");
      }
    } catch {
      toast("error", "서버 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">메모 (선택)</label>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="처리 사유를 입력하세요..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-mint focus:ring-1 focus:ring-mint"
        />
      </div>
      <button
        onClick={() => handleAction("REJECT")}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        <XCircle className="h-4 w-4" /> 위반 확인 (매물 숨김)
      </button>
      <button
        onClick={() => handleAction("APPROVE")}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        <CheckCircle className="h-4 w-4" /> 정상 처리 (해제)
      </button>
      <button
        onClick={() => handleAction("REQUEST_MORE_INFO")}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        <MessageSquare className="h-4 w-4" /> 추가 자료 요청
      </button>
    </div>
  );
}
