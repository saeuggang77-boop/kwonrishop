"use client";

import { RefObject, useEffect, useState } from "react";
import BottomSheet from "./BottomSheet";

export const FLOOR_OPTIONS: { value: string; label: string }[] = [
  { value: "1", label: "1층" },
  { value: "2", label: "2층" },
  { value: "3plus", label: "3층 이상" },
  { value: "basement", label: "지하" },
];

interface FloorSheetProps {
  open: boolean;
  onClose: () => void;
  initial: string[];
  onApply: (next: string[]) => void;
  anchorRef?: RefObject<HTMLElement | null>;
  popoverWidth?: number;
}

export default function FloorSheet({
  open,
  onClose,
  initial,
  onApply,
  anchorRef,
  popoverWidth = 480,
}: FloorSheetProps) {
  const [selected, setSelected] = useState<string[]>(initial);

  useEffect(() => {
    if (open) setSelected(initial);
  }, [open, initial]);

  const toggle = (value: string) => {
    // 단일 선택: 같은 것 다시 누르면 해제, 아니면 덮어쓰기
    const next = selected.includes(value) && selected.length === 1 ? [] : [value];
    setSelected(next);
    onApply(next);
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="층수"
      onSubmit={() => onApply(selected)}
      anchorRef={anchorRef}
      popoverWidth={popoverWidth}
      hideSubmit
    >
      <p className="text-xs text-muted mb-4">한 개 선택 후 자동 닫힘</p>
      <div className="flex flex-wrap gap-2">
        {FLOOR_OPTIONS.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={`
                px-4 py-2 rounded-full text-sm font-semibold transition-all
                ${active
                  ? "bg-green-700 text-cream shadow-[0_4px_12px_rgba(31,63,46,0.2)]"
                  : "bg-white border border-line text-ink hover:border-green-700"
                }
              `}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
