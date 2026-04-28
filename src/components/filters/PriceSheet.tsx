"use client";

import { RefObject, useEffect, useState } from "react";
import BottomSheet from "./BottomSheet";
import DualRangeSlider from "./DualRangeSlider";

export interface PriceState {
  premiumMin: number;
  premiumMax: number;
  premiumNone: boolean;
  premiumNegotiable: boolean;
  depositMin: number;
  depositMax: number;
  rentMin: number;
  rentMax: number;
}

interface PriceSheetProps {
  open: boolean;
  onClose: () => void;
  initial: PriceState;
  onApply: (next: PriceState) => void;
  anchorRef?: RefObject<HTMLElement | null>;
  popoverWidth?: number;
}

const PREMIUM_MIN = 0;
const PREMIUM_MAX = 30000; // 3억(만원)
const PREMIUM_STEP = 100;

const DEPOSIT_MIN = 0;
const DEPOSIT_MAX = 30000;
const DEPOSIT_STEP = 100;

const RENT_MIN = 0;
const RENT_MAX = 1000;
const RENT_STEP = 10;

const PREMIUM_LABELS = ["0", "5천만", "1억", "2억", "3억+"];
const DEPOSIT_LABELS = ["0", "5천만", "1억", "2억", "3억+"];
const RENT_LABELS = ["0", "100만", "300만", "500만", "1천만+"];

function formatMan(value: number): string {
  if (value === 0) return "0";
  if (value >= 10000) {
    const eok = value / 10000;
    return `${eok % 1 === 0 ? eok : eok.toFixed(1)}억`;
  }
  return `${value.toLocaleString()}만`;
}

export default function PriceSheet({
  open,
  onClose,
  initial,
  onApply,
  anchorRef,
  popoverWidth = 520,
}: PriceSheetProps) {
  const [state, setState] = useState<PriceState>(initial);

  useEffect(() => {
    if (open) setState(initial);
  }, [open, initial]);

  const update = <K extends keyof PriceState>(key: K, value: PriceState[K]) => {
    setState((prev) => {
      const next = { ...prev, [key]: value };
      onApply(next);
      return next;
    });
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="금액"
      onSubmit={() => onApply(state)}
      anchorRef={anchorRef}
      popoverWidth={popoverWidth}
      hideSubmitOnDesktop={false}
      submitLabel="닫기"
    >
      <div className="space-y-7">
        {/* 권리금 */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-sm font-semibold text-ink">권리금</h3>
            <span className="text-xs font-medium text-muted">
              {formatMan(state.premiumMin)} ~ {formatMan(state.premiumMax)}
              {state.premiumMax >= PREMIUM_MAX ? "+" : ""}
            </span>
          </div>
          <DualRangeSlider
            min={PREMIUM_MIN}
            max={PREMIUM_MAX}
            step={PREMIUM_STEP}
            valueMin={state.premiumMin}
            valueMax={state.premiumMax}
            onChange={({ min, max }) =>
              setState((prev) => ({ ...prev, premiumMin: min, premiumMax: max }))
            }
            onChangeEnd={({ min, max }) =>
              setState((prev) => {
                const next = { ...prev, premiumMin: min, premiumMax: max };
                onApply(next);
                return next;
              })
            }
            labels={PREMIUM_LABELS}
          />
          <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
            {/* 무권리만 토글 */}
            <button
              type="button"
              onClick={() => update("premiumNone", !state.premiumNone)}
              className={`
                inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                ${state.premiumNone
                  ? "bg-green-700 text-cream"
                  : "bg-white border border-line text-ink hover:border-green-700"
                }
              `}
            >
              {state.premiumNone && (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
              무권리만 보기
            </button>

            {/* 협의 가능 포함 체크박스 */}
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={state.premiumNegotiable}
                onChange={(e) => update("premiumNegotiable", e.target.checked)}
                className="w-4 h-4 accent-green-700"
              />
              <span className="text-xs font-medium text-ink-2">협의 가능 포함</span>
            </label>
          </div>
        </div>

        {/* 보증금 */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-sm font-semibold text-ink">보증금</h3>
            <span className="text-xs font-medium text-muted">
              {formatMan(state.depositMin)} ~ {formatMan(state.depositMax)}
              {state.depositMax >= DEPOSIT_MAX ? "+" : ""}
            </span>
          </div>
          <DualRangeSlider
            min={DEPOSIT_MIN}
            max={DEPOSIT_MAX}
            step={DEPOSIT_STEP}
            valueMin={state.depositMin}
            valueMax={state.depositMax}
            onChange={({ min, max }) =>
              setState((prev) => ({ ...prev, depositMin: min, depositMax: max }))
            }
            onChangeEnd={({ min, max }) =>
              setState((prev) => {
                const next = { ...prev, depositMin: min, depositMax: max };
                onApply(next);
                return next;
              })
            }
            labels={DEPOSIT_LABELS}
          />
        </div>

        {/* 월세 */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-sm font-semibold text-ink">월세</h3>
            <span className="text-xs font-medium text-muted">
              {formatMan(state.rentMin)} ~ {formatMan(state.rentMax)}
              {state.rentMax >= RENT_MAX ? "+" : ""}
            </span>
          </div>
          <DualRangeSlider
            min={RENT_MIN}
            max={RENT_MAX}
            step={RENT_STEP}
            valueMin={state.rentMin}
            valueMax={state.rentMax}
            onChange={({ min, max }) =>
              setState((prev) => ({ ...prev, rentMin: min, rentMax: max }))
            }
            onChangeEnd={({ min, max }) =>
              setState((prev) => {
                const next = { ...prev, rentMin: min, rentMax: max };
                onApply(next);
                return next;
              })
            }
            labels={RENT_LABELS}
          />
        </div>
      </div>
    </BottomSheet>
  );
}
