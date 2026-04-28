"use client";

import { RefObject, useEffect, useState } from "react";
import BottomSheet from "./BottomSheet";
import Select from "./Select";

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
  popoverWidth = 320,
}: ParkingSheetProps) {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    if (open) setValue(initial);
  }, [open, initial]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="주차"
      onSubmit={() => onApply(value)}
      anchorRef={anchorRef}
      popoverWidth={popoverWidth}
    >
      <Select
        label="주차 가능 여부"
        value={value}
        onChange={setValue}
        options={PARKING_OPTIONS}
        placeholder="선택"
      />
    </BottomSheet>
  );
}
