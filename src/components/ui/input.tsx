"use client";

import { cn } from "@/lib/utils/cn";
import { type InputHTMLAttributes, forwardRef, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div>
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={cn(
            "w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm",
            "focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none",
            "placeholder:text-gray-400",
            error && "border-red-400 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1 text-xs text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
