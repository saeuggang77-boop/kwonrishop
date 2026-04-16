// Usage:
// <BottomSheet open={filterOpen} onClose={() => setFilterOpen(false)} title="필터" footer={<button>적용</button>}>
//   <div>필터 옵션들</div>
// </BottomSheet>

"use client";

import {
  useEffect,
  useRef,
  useCallback,
  KeyboardEvent,
  TouchEvent,
  ReactNode,
} from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxHeight?: string;
}

export default function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
  maxHeight = "85vh",
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLElement | null>(null);
  const lastFocusableRef = useRef<HTMLElement | null>(null);

  // Touch/swipe state
  const touchStartY = useRef<number>(0);
  const touchCurrentY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  // Body scroll lock
  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      return () => {
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [open]);

  // Focus trap setup
  useEffect(() => {
    if (!open || !sheetRef.current) return;

    const focusableSelectors = [
      "a[href]",
      "button:not([disabled])",
      "textarea:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(", ");

    const focusableElements = Array.from(
      sheetRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
    );

    firstFocusableRef.current = focusableElements[0] ?? null;
    lastFocusableRef.current =
      focusableElements[focusableElements.length - 1] ?? null;

    // Move focus into sheet
    firstFocusableRef.current?.focus();
  }, [open]);

  // Escape key close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab") {
        if (!firstFocusableRef.current || !lastFocusableRef.current) return;
        if (e.shiftKey) {
          if (document.activeElement === firstFocusableRef.current) {
            e.preventDefault();
            lastFocusableRef.current.focus();
          }
        } else {
          if (document.activeElement === lastFocusableRef.current) {
            e.preventDefault();
            firstFocusableRef.current.focus();
          }
        }
      }
    },
    [onClose]
  );

  // Swipe-down to close
  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging.current || !sheetRef.current) return;
    touchCurrentY.current = e.touches[0].clientY;
    const delta = touchCurrentY.current - touchStartY.current;
    if (delta > 0) {
      // Only allow dragging down, not up
      sheetRef.current.style.transform = `translateY(${delta}px)`;
      sheetRef.current.style.transition = "none";
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || !sheetRef.current) return;
    isDragging.current = false;
    const delta = touchCurrentY.current - touchStartY.current;

    // Reset transform with transition
    sheetRef.current.style.transition = "";
    sheetRef.current.style.transform = "";

    if (delta > 80) {
      onClose();
    }
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "하단 시트"}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        style={{ maxHeight }}
        className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-white rounded-t-2xl shadow-[0_-8px_24px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-out outline-none ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Handle bar — draggable */}
        <div
          className="flex-shrink-0 flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-hidden="true"
        >
          <div className="w-9 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex-shrink-0 flex items-center justify-between px-5 pb-3 border-b border-gray-100">
            <h2 className="text-base font-semibold text-green-700">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="닫기"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 pb-safe">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
