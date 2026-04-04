"use client";

interface TierBadgeProps {
  tier: string;
  size?: "sm" | "md";
}

const TIER_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  // 사장님
  BASIC: { label: "베이직", bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-500 dark:text-gray-400" },
  PREMIUM: { label: "프리미엄", bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-700 dark:text-gray-300" },
  VIP: { label: "VIP", bg: "bg-navy-700 dark:bg-navy-600", text: "text-white dark:text-white" },
  // 프랜차이즈
  BRONZE: { label: "브론즈", bg: "bg-orange-100 dark:bg-orange-900", text: "text-orange-700 dark:text-orange-300" },
  SILVER: { label: "실버", bg: "bg-gray-200 dark:bg-gray-600", text: "text-gray-700 dark:text-gray-200" },
  GOLD: { label: "골드", bg: "bg-navy-700 dark:bg-navy-600", text: "text-white dark:text-white" },
};

export default function TierBadge({ tier, size = "sm" }: TierBadgeProps) {
  if (tier === "FREE") return null;
  const config = TIER_CONFIG[tier];
  if (!config) return null;

  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span className={`${config.bg} ${config.text} ${sizeClass} rounded-full font-bold`}>
      {config.label}
    </span>
  );
}
