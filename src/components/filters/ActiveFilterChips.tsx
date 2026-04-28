"use client";

export interface ActiveFilterChip {
  /** 식별 키 (제거 시 어떤 필터를 끌지 결정) */
  key: string;
  /** 화면 표시 라벨 */
  label: string;
}

interface ActiveFilterChipsProps {
  chips: ActiveFilterChip[];
  onRemove: (key: string) => void;
}

/**
 * 활성 필터 칩 행
 * - cream-elev 배경 + line 보더 + ink 텍스트 + 우측 ✕
 * - 누르면 그 조건만 제거
 */
export default function ActiveFilterChips({
  chips,
  onRemove,
}: ActiveFilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream-elev border border-line text-xs font-semibold text-ink"
        >
          {chip.label}
          <button
            type="button"
            onClick={() => onRemove(chip.key)}
            className="ml-0.5 -mr-1 p-0.5 rounded-full text-muted hover:text-terra-500 hover:bg-white transition-colors"
            aria-label={`${chip.label} 필터 제거`}
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </span>
      ))}
    </div>
  );
}
