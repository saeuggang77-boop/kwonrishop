"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  label?: string;
}

/**
 * 커스텀 드롭다운 (네이티브 select 안 씀)
 * - 옵션 패널은 Portal로 document.body에 렌더 + fixed 포지션
 *   → 부모 컨테이너의 overflow:hidden/auto에 클리핑되지 않음 (BottomSheet 안에서도 정상)
 * - 위/아래 공간 비교 후 자동으로 펼침 방향 결정
 * - 스크롤/리사이즈 시 위치 재계산
 */
export default function Select({
  value,
  onChange,
  options,
  placeholder = "선택하세요",
  disabled = false,
  label,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const selected = options.find((o) => o.value === value);

  // 옵션 패널 위치 계산: 아래 공간 우선, 부족하면 위로
  const computePos = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const margin = 8;
    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const desiredHeight = Math.min(320, options.length * 44 + 8);

    const dropUp = spaceBelow < desiredHeight && spaceAbove > spaceBelow;
    const maxHeight = Math.max(120, Math.min(desiredHeight, dropUp ? spaceAbove : spaceBelow));
    const top = dropUp ? Math.max(margin, rect.top - maxHeight - 6) : rect.bottom + 6;

    setPos({
      top,
      left: rect.left,
      width: rect.width,
      maxHeight,
    });
  }, [options.length]);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    computePos();
  }, [open, computePos]);

  // 스크롤/리사이즈 시 위치 재계산
  useEffect(() => {
    if (!open) return;
    const onScrollResize = () => computePos();
    window.addEventListener("scroll", onScrollResize, true);
    window.addEventListener("resize", onScrollResize);
    return () => {
      window.removeEventListener("scroll", onScrollResize, true);
      window.removeEventListener("resize", onScrollResize);
    };
  }, [open, computePos]);

  // 외부 클릭 시 닫힘 (트리거 + 드롭다운 외부)
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // ESC 닫기
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleSelect = useCallback(
    (optValue: string) => {
      onChange(optValue);
      setOpen(false);
    },
    [onChange]
  );

  const dropdown =
    open && pos && mounted
      ? createPortal(
          <ul
            ref={dropdownRef}
            role="listbox"
            className="fixed z-[100] overflow-y-auto bg-white border border-line rounded-xl shadow-[0_8px_32px_rgba(31,63,46,0.12),0_2px_8px_rgba(31,63,46,0.06)] py-1"
            style={{
              top: pos.top,
              left: pos.left,
              width: pos.width,
              maxHeight: pos.maxHeight,
            }}
          >
            {options.length === 0 && (
              <li className="px-4 py-2.5 text-sm text-muted">옵션이 없습니다</li>
            )}
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.value)}
                  className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-green-700 text-cream font-semibold"
                      : "text-ink hover:bg-cream-elev"
                  }`}
                >
                  {opt.label}
                </li>
              );
            })}
          </ul>,
          document.body
        )
      : null;

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-sm font-semibold text-ink-2 mb-1.5">
          {label}
        </label>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`
          w-full flex items-center justify-between
          px-4 py-3 rounded-xl text-sm font-medium
          bg-cream-elev border border-line
          transition-colors
          ${disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:border-green-700 cursor-pointer"
          }
          ${open ? "border-green-700" : ""}
        `}
      >
        <span className={selected ? "text-ink" : "text-muted"}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {dropdown}
    </div>
  );
}
