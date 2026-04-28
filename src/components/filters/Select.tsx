"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
 * - 닫힘: cream-elev 배경 + line-soft 1px + chevron
 * - 호버: green-700 보더
 * - 펼침: white 배경 + 다층 그림자, 옵션 hover cream-elev, 선택 옵션 green-700
 * - 외부 클릭 시 닫힘
 * - max-height 320px + scroll
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
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  // 외부 클릭 시 닫힘
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
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

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-sm font-semibold text-ink-2 mb-1.5">
          {label}
        </label>
      )}
      <button
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

      {open && (
        <ul
          role="listbox"
          className="
            absolute z-20 left-0 right-0 mt-1.5
            max-h-[320px] overflow-y-auto
            bg-white border border-line rounded-xl
            shadow-[0_8px_32px_rgba(31,63,46,0.12),0_2px_8px_rgba(31,63,46,0.06)]
            py-1
          "
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
                className={`
                  px-4 py-2.5 text-sm cursor-pointer transition-colors
                  ${isSelected
                    ? "bg-green-700 text-cream font-semibold"
                    : "text-ink hover:bg-cream-elev"
                  }
                `}
              >
                {opt.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
