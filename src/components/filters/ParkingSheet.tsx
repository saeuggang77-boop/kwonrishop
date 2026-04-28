"use client";

import { RefObject, useEffect, useState } from "react";
import BottomSheet from "./BottomSheet";

interface ParkingSheetProps {
  open: boolean;
  onClose: () => void;
  initial: string;
  onApply: (next: string) => void;
  anchorRef?: RefObject<HTMLElement | null>;
  popoverWidth?: number;
}

const PARKING_OPTIONS = [
  { value: "", label: "전체" },
  { value: "yes", label: "주차 가능" },
  { value: "no", label: "주차 불가" },
];

export default function ParkingSheet({
  open,
  onClose,
  initial,
  onApply,
  anchorRef,
  popoverWidth = 360,
}: ParkingSheetProps) {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    if (open) setValue(initial);
  }, [open, initial]);

  const select = (v: string) => {
    setValue(v);
    onApply(v);
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="주차"
      onSubmit={() => onApply(value)}
      anchorRef={anchorRef}
      popoverWidth={popoverWidth}
      hideSubmit
    >
      <div className="flex flex-wrap gap-2">
        {PARKING_OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => select(opt.value)}
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
