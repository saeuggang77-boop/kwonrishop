"use client";

import { useCallback, useMemo } from "react";

interface DualRangeSliderProps {
  min: number;
  max: number;
  step: number;
  valueMin: number;
  valueMax: number;
  onChange: (next: { min: number; max: number }) => void;
  /**
   * 슬라이더 release(mouseup/touchend/keyup) 시점에 호출.
   * onChange는 드래그 동안 매 프레임 호출되므로 fetch 같은 비싼 작업은 onChangeEnd에서 트리거.
   */
  onChangeEnd?: (next: { min: number; max: number }) => void;
  /** 균등 배치 라벨 (5개 권장) */
  labels: string[];
  /** 값 단위 (예: "만") — 기본값으로는 미사용 */
  unit?: string;
}

/**
 * 듀얼 핸들 레인지 슬라이더
 * - 트랙 8px + 채워진 부분 green-700
 * - 핸들 22px white + green-700 2px 보더
 * - 라벨 균등 배치
 * - 두 핸들 충돌 방지 (min < max)
 *
 * 구현: 두 개의 native <input type="range"> 를 겹쳐 트랙을 공유한다.
 */
export default function DualRangeSlider({
  min,
  max,
  step,
  valueMin,
  valueMax,
  onChange,
  onChangeEnd,
  labels,
}: DualRangeSliderProps) {
  const handleCommit = useCallback(() => {
    if (!onChangeEnd) return;
    onChangeEnd({ min: valueMin, max: valueMax });
  }, [onChangeEnd, valueMin, valueMax]);
  const minPct = useMemo(() => {
    const span = max - min;
    return span > 0 ? ((valueMin - min) / span) * 100 : 0;
  }, [valueMin, min, max]);

  const maxPct = useMemo(() => {
    const span = max - min;
    return span > 0 ? ((valueMax - min) / span) * 100 : 100;
  }, [valueMax, min, max]);

  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = Math.min(Number(e.target.value), valueMax - step);
      onChange({ min: Math.max(min, next), max: valueMax });
    },
    [valueMax, step, min, onChange]
  );

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = Math.max(Number(e.target.value), valueMin + step);
      onChange({ min: valueMin, max: Math.min(max, next) });
    },
    [valueMin, step, max, onChange]
  );

  return (
    <div className="w-full">
      {/* 트랙 영역 */}
      <div className="relative h-8 flex items-center">
        {/* 배경 트랙 */}
        <div className="absolute left-0 right-0 h-2 rounded-full bg-line" />
        {/* 채워진 트랙 */}
        <div
          className="absolute h-2 rounded-full bg-green-700"
          style={{
            left: `${minPct}%`,
            right: `${100 - maxPct}%`,
          }}
        />

        {/* min 슬라이더 */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={valueMin}
          onChange={handleMinChange}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          onKeyUp={handleCommit}
          aria-label="최소값"
          className="dual-range-input dual-range-input--min"
          style={{ zIndex: minPct > 90 ? 5 : 3 }}
        />
        {/* max 슬라이더 */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={valueMax}
          onChange={handleMaxChange}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          onKeyUp={handleCommit}
          aria-label="최대값"
          className="dual-range-input dual-range-input--max"
          style={{ zIndex: 4 }}
        />
      </div>

      {/* 라벨 */}
      {labels.length > 0 && (
        <div className="relative mt-1 h-5">
          {labels.map((lab, i) => {
            const pct = labels.length > 1 ? (i / (labels.length - 1)) * 100 : 50;
            return (
              <span
                key={`${lab}-${i}`}
                className="absolute top-0 text-[11px] font-medium text-muted -translate-x-1/2 whitespace-nowrap"
                style={{ left: `${pct}%` }}
              >
                {lab}
              </span>
            );
          })}
        </div>
      )}

      {/* 슬라이더 스타일 (scoped via class names) */}
      <style jsx>{`
        .dual-range-input {
          position: absolute;
          left: 0;
          right: 0;
          width: 100%;
          height: 32px;
          background: transparent;
          pointer-events: none;
          -webkit-appearance: none;
          appearance: none;
          margin: 0;
          padding: 0;
        }
        .dual-range-input::-webkit-slider-thumb {
          pointer-events: auto;
          -webkit-appearance: none;
          appearance: none;
          height: 22px;
          width: 22px;
          border-radius: 9999px;
          background: #ffffff;
          border: 2px solid #1f3f2e;
          box-shadow: 0 2px 6px rgba(31, 63, 46, 0.2);
          cursor: pointer;
        }
        .dual-range-input::-moz-range-thumb {
          pointer-events: auto;
          height: 22px;
          width: 22px;
          border-radius: 9999px;
          background: #ffffff;
          border: 2px solid #1f3f2e;
          box-shadow: 0 2px 6px rgba(31, 63, 46, 0.2);
          cursor: pointer;
        }
        .dual-range-input::-webkit-slider-runnable-track {
          background: transparent;
          height: 8px;
        }
        .dual-range-input::-moz-range-track {
          background: transparent;
          height: 8px;
        }
      `}</style>
    </div>
  );
}
