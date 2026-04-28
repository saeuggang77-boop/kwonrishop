"use client";

import { ReactNode, RefObject } from "react";

export type ChipKey =
  | "region"
  | "industry"
  | "revenueDoc"
  | "theme"
  | "price"
  | "floor"
  | "area"
  | "parking";

export interface ChipState {
  region: boolean;
  industry: boolean;
  revenueDoc: boolean;
  theme: boolean;
  price: boolean;
  floor: boolean;
  area: boolean;
  parking: boolean;
}

export interface ChipRefs {
  region?: RefObject<HTMLButtonElement | null>;
  industry?: RefObject<HTMLButtonElement | null>;
  revenueDoc?: RefObject<HTMLButtonElement | null>;
  theme?: RefObject<HTMLButtonElement | null>;
  price?: RefObject<HTMLButtonElement | null>;
  floor?: RefObject<HTMLButtonElement | null>;
  area?: RefObject<HTMLButtonElement | null>;
  parking?: RefObject<HTMLButtonElement | null>;
}

interface FilterChipBarProps {
  /** 칩별 활성 여부 */
  active: ChipState;
  /** 활성 필터 1개 이상이면 true (↺ 초기화 칩 강조) */
  hasAnyActive: boolean;
  /** 시트를 여는 칩 클릭 핸들러 */
  onChipClick: (key: ChipKey) => void;
  /** 매출증빙 토글 핸들러 (즉시 반영) */
  onToggleRevenueDoc: () => void;
  /** 전체 초기화 핸들러 */
  onReset: () => void;
  /** PC popover 모드용 칩 ref. 시트 컴포넌트의 anchorRef로 forward됨 */
  chipRefs?: ChipRefs;
  /** 현재 popover로 펼쳐진 칩 (활성 시각화: green-700 보더 2px) */
  openChip?: ChipKey | null;
}

/**
 * 빠른 필터 칩 바 (가로 스크롤)
 * 순서: ↺ 초기화 / 지역 / 업종 / 매출증빙 / 테마 / 금액 / 층수 / 면적 / 주차
 * - 비활성: white + line border + ink
 * - 활성: green-700 + cream
 * - 매출증빙: 즉시 토글 (시트 X)
 * - ↺ 초기화: hasAnyActive 시 terra-500 텍스트
 * - openChip: PC popover로 열린 칩은 green-700 보더 2px (배경 white 유지)
 */
export default function FilterChipBar({
  active,
  hasAnyActive,
  onChipClick,
  onToggleRevenueDoc,
  onReset,
  chipRefs,
  openChip,
}: FilterChipBarProps) {
  return (
    <div className="bg-cream-elev rounded-2xl border border-line p-2">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
        {/* ↺ 초기화 */}
        <ChipButton
          onClick={onReset}
          variant="reset"
          highlighted={hasAnyActive}
          ariaLabel="모든 필터 초기화"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          초기화
        </ChipButton>

        <ChipButton
          onClick={() => onChipClick("region")}
          active={active.region}
          open={openChip === "region"}
          buttonRef={chipRefs?.region}
        >
          지역
        </ChipButton>
        <ChipButton
          onClick={() => onChipClick("industry")}
          active={active.industry}
          open={openChip === "industry"}
          buttonRef={chipRefs?.industry}
        >
          업종
        </ChipButton>

        {/* 매출증빙 — 즉시 토글 */}
        <ChipButton
          onClick={onToggleRevenueDoc}
          active={active.revenueDoc}
          ariaPressed={active.revenueDoc}
          buttonRef={chipRefs?.revenueDoc}
        >
          {active.revenueDoc && (
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
          매출증빙
        </ChipButton>

        <ChipButton
          onClick={() => onChipClick("theme")}
          active={active.theme}
          open={openChip === "theme"}
          buttonRef={chipRefs?.theme}
        >
          테마
        </ChipButton>
        <ChipButton
          onClick={() => onChipClick("price")}
          active={active.price}
          open={openChip === "price"}
          buttonRef={chipRefs?.price}
        >
          금액
        </ChipButton>
        <ChipButton
          onClick={() => onChipClick("floor")}
          active={active.floor}
          open={openChip === "floor"}
          buttonRef={chipRefs?.floor}
        >
          층수
        </ChipButton>
        <ChipButton
          onClick={() => onChipClick("area")}
          active={active.area}
          open={openChip === "area"}
          buttonRef={chipRefs?.area}
        >
          면적
        </ChipButton>
        <ChipButton
          onClick={() => onChipClick("parking")}
          active={active.parking}
          open={openChip === "parking"}
          buttonRef={chipRefs?.parking}
        >
          주차
        </ChipButton>
      </div>
    </div>
  );
}

interface ChipButtonProps {
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
  variant?: "default" | "reset";
  highlighted?: boolean;
  ariaLabel?: string;
  ariaPressed?: boolean;
  buttonRef?: RefObject<HTMLButtonElement | null>;
  /** PC popover로 열린 상태 */
  open?: boolean;
}

function ChipButton({
  onClick,
  children,
  active = false,
  variant = "default",
  highlighted = false,
  ariaLabel,
  ariaPressed,
  buttonRef,
  open = false,
}: ChipButtonProps) {
  let className =
    "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all shrink-0 ";

  if (variant === "reset") {
    className += highlighted
      ? "bg-white border border-terra-500 text-terra-500 hover:bg-terra-50"
      : "bg-white border border-line text-muted hover:border-green-700";
  } else if (open) {
    // PC popover로 펼쳐진 상태: white 배경 + green-700 보더 2px + 살짝 들뜬 그림자
    className +=
      "bg-white border-2 border-green-700 text-green-700 shadow-[0_4px_14px_rgba(31,63,46,0.12)]";
  } else if (active) {
    className +=
      "bg-green-700 text-cream shadow-[0_4px_12px_rgba(31,63,46,0.18)]";
  } else {
    className +=
      "bg-white border border-line text-ink hover:border-green-700";
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      className={className}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
    >
      {children}
    </button>
  );
}
