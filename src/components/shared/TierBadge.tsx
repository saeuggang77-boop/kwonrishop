"use client";

interface TierBadgeProps {
  tier: string;
  size?: "sm" | "md";
}

// B안 — 3단계 색 위계 확립 (light / brand / accent)
const TIER_CONFIG: Record<string, { label: string; bg: string; text: string; border?: string }> = {
  // 사장님 매물 (3단계)
  BASIC:   { label: "베이직",   bg: "bg-green-100", text: "text-green-700" },
  PREMIUM: { label: "프리미엄", bg: "bg-green-700", text: "text-cream" },
  VIP:     { label: "VIP",      bg: "bg-terra-500", text: "text-cream" },
  // 프랜차이즈 (3단계)
  BRONZE:  { label: "브론즈",   bg: "bg-terra-100", text: "text-terra-700" },
  SILVER:  { label: "실버",     bg: "bg-green-700", text: "text-cream" },
  GOLD:    { label: "골드",     bg: "bg-terra-500", text: "text-cream" },
};

export default function TierBadge({ tier, size = "sm" }: TierBadgeProps) {
  if (tier === "FREE") return null;
  const config = TIER_CONFIG[tier];
  if (!config) return null;

  const sizeClass = size === "sm"
    ? "px-2.5 py-0.5 text-xs"
    : "px-3 py-1 text-xs";

  return (
    <span className={`${config.bg} ${config.text} ${sizeClass} rounded-full font-bold tracking-wide inline-flex items-center`}>
      {config.label}
    </span>
  );
}
