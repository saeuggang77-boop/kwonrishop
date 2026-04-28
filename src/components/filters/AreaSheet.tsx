"use client";

import { RefObject, useEffect, useState } from "react";
import BottomSheet from "./BottomSheet";
import DualRangeSlider from "./DualRangeSlider";

export interface AreaState {
  areaMin: number;
  areaMax: number;
}

interface AreaSheetProps {
  open: boolean;
  onClose: () => void;
  initial: AreaState;
  onApply: (next: AreaState) => void;
  anchorRef?: RefObject<HTMLElement | null>;
  popoverWidth?: number;
}

const AREA_MIN = 0;
const AREA_MAX = 100;
const AREA_STEP = 1;
const AREA_LABELS = ["5", "10", "20", "30", "50", "100+"];

const QUICK_PRESETS: { label: string; min: number; max: number }[] = [
  { label: "~10평", min: 0, max: 10 },
  { label: "10~20평", min: 10, max: 20 },
  { label: "20~30평", min: 20, max: 30 },
  { label: "30평+", min: 30, max: AREA_MAX },
];

export default function AreaSheet({
  open,
  onClose,
  initial,
  onApply,
  anchorRef,
  popoverWidth = 480,
}: AreaSheetProps) {
  const [state, setState] = useState<AreaState>(initial);

  useEffect(() => {
    if (open) setState(initial);
  }, [open, initial]);

  const matchesPreset = (preset: { min: number; max: number }) =>
    state.areaMin === preset.min && state.areaMax === preset.max;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="면적"
      onSubmit={() => onApply(state)}
      anchorRef={anchorRef}
      popoverWidth={popoverWidth}
      hideSubmitOnDesktop={false}
      submitLabel="닫기"
    >
      <div className="space-y-6">
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-sm font-semibold text-ink">면적 (평)</h3>
            <span className="text-xs font-medium text-muted">
              {state.areaMin}평 ~ {state.areaMax}
              {state.areaMax >= AREA_MAX ? "+" : ""}평
            </span>
          </div>
          <DualRangeSlider
            min={AREA_MIN}
            max={AREA_MAX}
            step={AREA_STEP}
            valueMin={state.areaMin}
            valueMax={state.areaMax}
            onChange={({ min, max }) => setState({ areaMin: min, areaMax: max })}
            onChangeEnd={({ min, max }) => {
              const next = { areaMin: min, areaMax: max };
              setState(next);
              onApply(next);
            }}
            labels={AREA_LABELS}
          />
        </div>

        <div>
          <p className="text-xs text-muted mb-2">빠른 선택</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PRESETS.map((preset) => {
              const active = matchesPreset(preset);
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    const next = { areaMin: preset.min, areaMax: preset.max };
                    setState(next);
                    onApply(next);
                  }}
                  className={`
                    px-4 py-2 rounded-full text-sm font-semibold transition-all
                    ${active
                      ? "bg-green-700 text-cream shadow-[0_4px_12px_rgba(31,63,46,0.2)]"
                      : "bg-white border border-line text-ink hover:border-green-700"
                    }
                  `}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
