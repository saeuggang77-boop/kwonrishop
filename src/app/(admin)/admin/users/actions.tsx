"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ShieldOff } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function UserActions({
  userId,
  currentStatus,
}: {
  userId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: "SUSPEND" | "ACTIVATE") => {
    const actionText = action === "SUSPEND" ? "정지" : "활성화";
    if (!confirm(`정말 이 회원을 ${actionText}하시겠습니까?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error("Failed to perform action");
      }

      router.refresh();
    } catch {
      toast("error", "작업에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (currentStatus === "SUSPENDED") {
    return (
      <button
        onClick={() => handleAction("ACTIVATE")}
        disabled={isLoading}
        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 transition-colors disabled:opacity-50"
      >
        <Shield className="w-3 h-3" />
        활성화
      </button>
    );
  }

  return (
    <button
      onClick={() => handleAction("SUSPEND")}
      disabled={isLoading}
      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
    >
      <ShieldOff className="w-3 h-3" />
      정지
    </button>
  );
}
