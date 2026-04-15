"use client";

import Link from "next/link";

interface Props {
  size?: "sm" | "md" | "lg";
  href?: string | null;
  markOnly?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { dot: 8, text: "text-base" },
  md: { dot: 10, text: "text-xl" },
  lg: { dot: 14, text: "text-2xl" },
};

export default function Logo({ size = "md", href = "/", markOnly = false, className = "" }: Props) {
  const cfg = sizeMap[size];

  const inner = (
    <span className={`inline-flex items-center gap-2 font-extrabold text-green-700 tracking-tight ${cfg.text} ${className}`}>
      <span
        className="rounded-full bg-terra-500 shrink-0"
        style={{ width: cfg.dot, height: cfg.dot }}
        aria-hidden="true"
      />
      {!markOnly && <span>권리샵</span>}
    </span>
  );

  if (!href) return inner;
  return (
    <Link href={href} className="outline-none" aria-label="권리샵 홈">
      {inner}
    </Link>
  );
}
