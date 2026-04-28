"use client";

import { ReactNode, RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** 시트 하단 sticky 검색 버튼 핸들러 */
  onSubmit: () => void;
  /** 검색 버튼 라벨 (기본: 검색) */
  submitLabel?: string;
  /** PC 인라인 popover 앵커. 제공되고 viewport >= 768px일 때 popover 모드로 동작 */
  anchorRef?: RefObject<HTMLElement | null>;
  /** PC popover 가로 크기(px). 기본 480 */
  popoverWidth?: number;
  /** PC popover에서 검색 버튼 숨김 (기본 true). PC는 외부 클릭/ESC 시 자동으로 onSubmit 호출 */
  hideSubmitOnDesktop?: boolean;
}

/**
 * 매물 필터 시트
 * - 모바일(<768px) 또는 anchorRef 미제공: 부분 바텀시트 (기존 동작)
 * - PC(>=768px) + anchorRef 제공: 칩 바로 아래 인라인 popover
 *   - 위치: 칩 bottom + 8px, 가운데 정렬, viewport 경계 보정
 *   - 화살표(꼬리): popover 상단 가운데 정사각형 회전
 *   - 검색 버튼 없음 (옵션 변경 시 자동 onSubmit, 닫힐 때 자동 onSubmit)
 *   - 외부 클릭/ESC로 닫힘
 */
export default function BottomSheet({
  open,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel = "검색",
  anchorRef,
  popoverWidth = 480,
  hideSubmitOnDesktop = true,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // viewport 분기 (PC popover 가능 여부)
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const isPopoverMode = isDesktop && !!anchorRef?.current;

  // popover 위치 계산
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; arrowLeft: number } | null>(null);

  const computePosition = useCallback(() => {
    const anchor = anchorRef?.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const padding = 8;
    const chipCenterX = rect.left + rect.width / 2;

    let left = chipCenterX - popoverWidth / 2;
    if (left + popoverWidth > viewportW - padding) {
      left = viewportW - popoverWidth - padding;
    }
    if (left < padding) {
      left = padding;
    }
    const top = rect.bottom + 8;
    // 화살표는 칩 중앙을 가리켜야 함 (popover 기준 좌표)
    const arrowLeft = chipCenterX - left;
    setPopoverPos({ top, left, arrowLeft });
  }, [anchorRef, popoverWidth]);

  useLayoutEffect(() => {
    if (!open || !isPopoverMode) return;
    computePosition();
  }, [open, isPopoverMode, computePosition]);

  useEffect(() => {
    if (!open || !isPopoverMode) return;
    const handler = () => computePosition();
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
    };
  }, [open, isPopoverMode, computePosition]);

  // ESC + 포커스 진입
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    sheetRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  // body scroll lock — 모바일(시트) 모드에서만. PC popover에서는 잠그지 않음.
  useEffect(() => {
    if (!open || isPopoverMode) return;

    const scrollY = window.scrollY;
    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const prevTop = document.body.style.top;
    const prevWidth = document.body.style.width;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.top = `-${scrollY}px`;

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.position = prevPosition;
      document.body.style.top = prevTop;
      document.body.style.width = prevWidth;
      window.scrollTo(0, scrollY);
    };
  }, [open, isPopoverMode]);

  // 뒤로가기(popstate) — 모바일(시트) 모드에서만
  useEffect(() => {
    if (!open || isPopoverMode) return;

    window.history.pushState({ filterSheet: true }, "");
    const handlePopState = () => {
      onClose();
    };
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [open, isPopoverMode, onClose]);

  // PC popover: 외부 클릭 감지 → 자동 onSubmit + close
  useEffect(() => {
    if (!open || !isPopoverMode) return;

    const handler = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (sheetRef.current?.contains(target)) return;
      if (anchorRef?.current?.contains(target)) return;
      onSubmit();
      onClose();
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, isPopoverMode, onSubmit, onClose, anchorRef]);

  const handleClose = useCallback(() => {
    if (!isPopoverMode && window.history.state?.filterSheet) {
      window.history.back();
    } else {
      onClose();
    }
  }, [onClose, isPopoverMode]);

  const handleSubmit = useCallback(() => {
    onSubmit();
    handleClose();
  }, [onSubmit, handleClose]);

  if (!open) return null;

  // ────────────────────────────────────────────────
  // PC 인라인 popover 모드
  // ────────────────────────────────────────────────
  if (isPopoverMode) {
    const showSubmit = !hideSubmitOnDesktop;
    return (
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="false"
        aria-label={title}
        tabIndex={-1}
        className="fixed z-[60] bg-white border border-line rounded-2xl outline-none flex flex-col"
        style={{
          top: popoverPos?.top ?? -9999,
          left: popoverPos?.left ?? -9999,
          width: popoverWidth,
          maxHeight: "min(80vh, 600px)",
          boxShadow:
            "0 4px 12px rgba(0,0,0,0.06), 0 16px 40px rgba(31,63,46,0.12)",
          visibility: popoverPos ? "visible" : "hidden",
        }}
      >
        {/* 화살표 (꼬리) */}
        {popoverPos && (
          <div
            aria-hidden
            className="absolute"
            style={{
              top: -7,
              left: popoverPos.arrowLeft - 7,
              width: 12,
              height: 12,
              transform: "rotate(45deg)",
              backgroundColor: "white",
              borderTop: "1px solid var(--color-line, #e5e0d6)",
              borderLeft: "1px solid var(--color-line, #e5e0d6)",
              borderTopLeftRadius: 2,
            }}
          />
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {/* 옵션: 검색 버튼 */}
        {showSubmit && (
          <div className="px-6 py-4 border-t border-line bg-white rounded-b-2xl">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full py-3 bg-green-700 text-cream rounded-full font-semibold text-sm hover:bg-green-800 transition-colors"
            >
              {submitLabel}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ────────────────────────────────────────────────
  // 모바일 / fallback: 부분 바텀시트
  // ────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[60]">
      {/* 백드롭 */}
      <button
        type="button"
        aria-label="필터 시트 닫기"
        onClick={handleClose}
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundColor: "rgba(31, 63, 46, 0.45)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
        }}
      />

      {/* 시트 */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="
          absolute bottom-0 left-0 right-0
          bg-cream rounded-t-3xl shadow-[0_-12px_40px_rgba(31,63,46,0.18)]
          flex flex-col outline-none
          max-h-[80vh]
          md:bottom-auto md:top-1/2 md:left-1/2 md:right-auto
          md:-translate-x-1/2 md:-translate-y-1/2
          md:rounded-3xl md:max-w-md md:w-[92vw] md:max-h-[80vh]
        "
      >
        {/* Grab handle (모바일 전용) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden" aria-hidden>
          <div className="w-8 h-1 rounded-full bg-line-deep" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-3 md:pt-6 pb-2">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 -mr-2 rounded-full text-muted hover:text-ink hover:bg-cream-elev transition-colors"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body (스크롤 가능) */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

        {/* Sticky 검색 버튼 */}
        <div className="px-6 py-4 border-t border-line bg-cream rounded-b-none md:rounded-b-3xl pb-safe">
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full py-3.5 bg-green-700 text-cream rounded-full font-semibold text-base hover:bg-green-800 transition-colors shadow-[0_4px_16px_rgba(31,63,46,0.2)]"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
