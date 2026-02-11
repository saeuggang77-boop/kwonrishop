"use client";

import { cn } from "@/lib/utils/cn";
import { type TextareaHTMLAttributes, forwardRef, useId } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, showCount, className, id, maxLength, value, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const errorId = error ? `${textareaId}-error` : undefined;
    const currentLength = typeof value === "string" ? value.length : 0;

    return (
      <div>
        {label && (
          <label htmlFor={textareaId} className="mb-1 block text-sm font-medium text-navy">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          maxLength={maxLength}
          value={value}
          className={cn(
            "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors",
            "focus:border-mint focus:ring-2 focus:ring-mint/20",
            "placeholder:text-gray-400",
            "resize-y min-h-[100px]",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          {...props}
        />
        <div className="mt-1 flex items-center justify-between">
          {error ? (
            <p id={errorId} className="text-xs text-red-500" role="alert">
              {error}
            </p>
          ) : (
            <span />
          )}
          {showCount && maxLength && (
            <span className={cn("text-xs", currentLength >= maxLength ? "text-red-500" : "text-gray-500")}>
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
