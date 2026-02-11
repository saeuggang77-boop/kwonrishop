"use client";

import { Scale, Check } from "lucide-react";
import { useCompare, type CompareItem } from "@/lib/compare-context";
import { useToast } from "@/components/ui/toast";

interface CompareButtonProps {
  listing: CompareItem;
  variant?: "card" | "detail";
}

export function CompareButton({ listing, variant = "card" }: CompareButtonProps) {
  const { add, remove, has, isFull } = useCompare();
  const { toast } = useToast();

  const isAdded = has(listing.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAdded) {
      remove(listing.id);
      return;
    }

    if (isFull) {
      toast("info", "최대 4개까지 비교할 수 있습니다.");
      return;
    }

    const added = add(listing);
    if (added) {
      toast("success", "비교 목록에 추가되었습니다.");
    }
  };

  if (variant === "detail") {
    return (
      <button
        onClick={handleClick}
        className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
          isAdded
            ? "border border-mint bg-mint/10 text-mint"
            : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        }`}
      >
        {isAdded ? <Check className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
        {isAdded ? "비교 목록에 추가됨" : "비교 담기"}
      </button>
    );
  }

  // Card variant — icon only overlay
  return (
    <button
      onClick={handleClick}
      className={`absolute right-3 bottom-3 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-all ${
        isAdded
          ? "bg-mint text-white"
          : "bg-white/90 text-gray-600 opacity-0 backdrop-blur-sm group-hover:opacity-100 hover:bg-mint hover:text-white"
      }`}
      title={isAdded ? "비교 목록에서 제거" : "비교 담기"}
    >
      {isAdded ? <Check className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
    </button>
  );
}
