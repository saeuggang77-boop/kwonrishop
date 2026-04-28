"use client";

import { RefObject, useEffect, useState } from "react";
import BottomSheet from "./BottomSheet";
import Select from "./Select";
import { SIDO_LIST, SIGUNGU_BY_SIDO } from "@/lib/regions";

interface RegionSheetProps {
  open: boolean;
  onClose: () => void;
  initialSido: string;
  initialSigungu: string;
  onApply: (next: { sido: string; sigungu: string }) => void;
  anchorRef?: RefObject<HTMLElement | null>;
  popoverWidth?: number;
}

export default function RegionSheet({
  open,
  onClose,
  initialSido,
  initialSigungu,
  onApply,
  anchorRef,
  popoverWidth = 360,
}: RegionSheetProps) {
  const [sido, setSido] = useState(initialSido);
  const [sigungu, setSigungu] = useState(initialSigungu);

  // open 될 때 외부 값 동기화
  useEffect(() => {
    if (open) {
      setSido(initialSido);
      setSigungu(initialSigungu);
    }
  }, [open, initialSido, initialSigungu]);

  const sidoOptions = [
    { value: "", label: "전체 시/도" },
    ...SIDO_LIST.map((s) => ({ value: s, label: s })),
  ];

  const sigunguList = sido ? SIGUNGU_BY_SIDO[sido] || [] : [];
  const sigunguOptions = [
    { value: "", label: sido ? "전체 시/군/구" : "시/도를 먼저 선택하세요" },
    ...sigunguList.map((s) => ({ value: s, label: s })),
  ];

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="지역"
      onSubmit={() => onApply({ sido, sigungu })}
      anchorRef={anchorRef}
      popoverWidth={popoverWidth}
      hideSubmit
    >
      <div className="space-y-4">
        <Select
          label="시/도"
          value={sido}
          onChange={(v) => {
            setSido(v);
            setSigungu("");
            onApply({ sido: v, sigungu: "" });
          }}
          options={sidoOptions}
          placeholder="시/도 선택"
        />
        <Select
          label="시/군/구"
          value={sigungu}
          onChange={(v) => {
            setSigungu(v);
            onApply({ sido, sigungu: v });
            onClose();
          }}
          options={sigunguOptions}
          placeholder="시/군/구 선택"
          disabled={!sido}
        />
      </div>
    </BottomSheet>
  );
}
