"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "accent" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-green-700 text-cream hover:bg-green-800 active:bg-green-900",
  secondary: "bg-cream text-green-700 border border-line hover:bg-cream-elev hover:border-line-deep",
  accent: "bg-terra-500 text-cream hover:bg-terra-600 active:bg-terra-700",
  ghost: "bg-transparent text-green-700 hover:bg-cream-elev",
  destructive: "bg-red-500 text-white hover:bg-red-600",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-4 py-2 text-sm rounded-full",
  md: "px-6 py-3 text-sm rounded-full",
  lg: "px-8 py-4 text-base rounded-full",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", fullWidth = false, className = "", children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={`font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? "w-full" : ""} ${className}`}
        {...rest}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
