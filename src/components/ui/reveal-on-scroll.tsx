"use client";

import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

interface RevealOnScrollProps {
  children: ReactNode;
  className?: string;
  animation?: "fade-in" | "slide-up" | "slide-in-right";
  delay?: number;
}

export function RevealOnScroll({
  children,
  className,
  animation = "slide-up",
  delay = 0,
}: RevealOnScrollProps) {
  const { ref, inView } = useInView<HTMLDivElement>();

  const animationClass = {
    "fade-in": "animate-fade-in",
    "slide-up": "animate-slide-up",
    "slide-in-right": "animate-slide-in-right",
  }[animation];

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        opacity: inView ? undefined : 0,
        animation: inView ? undefined : "none",
        animationDelay: delay ? `${delay}ms` : undefined,
        animationFillMode: "both",
      }}
    >
      <div className={inView ? animationClass : undefined} style={{ animationDelay: delay ? `${delay}ms` : undefined, animationFillMode: "both" }}>
        {children}
      </div>
    </div>
  );
}
