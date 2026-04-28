"use client";

import { RefObject, useEffect, useState } from "react";
import BottomSheet from "./BottomSheet";

const THEMES = ["무권리", "급매", "신규", "역세권", "코너", "1층"];

interface ThemeSheetProps {
  open: boolean;
  onClose: () => void;
  initialThemes: string[];
  onApply: (themes: string[]) => void;
  anchorRef?: RefObject<HTMLElement | null>;
  popoverWidth?: number;
}

export default function ThemeSheet({
  open,
  onClose,
  initialThemes,
  onApply,
  anchorRef,
  popoverWidth = 480,
}: ThemeSheetProps) {
  const [selected, setSelected] = useState<string[]>(initialThemes);

  useEffect(() => {
    if (open) setSelected(initialThemes);
  }, [open, initialThemes]);

  const toggle = (theme: string) => {
    setSelected((prev) =>
      prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme]
    );
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="테마"
      onSubmit={() => onApply(selected)}
      anchorRef={anchorRef}
      popoverWidth={popoverWidth}
    >
      <p className="text-xs text-muted mb-4">여러 개 선택 가능</p>
      <div className="flex flex-wrap gap-2">
        {THEMES.map((theme) => {
          const active = selected.includes(theme);
          return (
            <button
              key={theme}
              type="button"
              onClick={() => toggle(theme)}
              className={`
                px-4 py-2 rounded-full text-sm font-semibold transition-all
                ${active
                  ? "bg-green-700 text-cream shadow-[0_4px_12px_rgba(31,63,46,0.2)]"
                  : "bg-white border border-line text-ink hover:border-green-700"
                }
              `}
            >
              {theme}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
