"use client";

interface TierBadgeProps {
  tier: string;
  size?: "sm" | "md";
}

const TIER_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  // 사장님
  BASIC: { label: "베이직", bg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-700 dark:text-blue-300" },
  PREMIUM: { label: "프리미엄", bg: "bg-gray-200 dark:bg-gray-600", text: "text-gray-700 dark:text-gray-200" },
  VIP: { label: "VIP", bg: "bg-yellow-100 dark:bg-yellow-900", text: "text-yellow-700 dark:text-yellow-300" },
  // 프랜차이즈
  BRONZE: { label: "브론즈", bg: "bg-orange-100 dark:bg-orange-900", text: "text-orange-700 dark:text-orange-300" },
  SILVER: { label: "실버", bg: "bg-gray-200 dark:bg-gray-600", text: "text-gray-700 dark:text-gray-200" },
  GOLD: { label: "골드", bg: "bg-yellow-100 dark:bg-yellow-900", text: "text-yellow-700 dark:text-yellow-300" },
};

export default function TierBadge({ tier, size = "sm" }: TierBadgeProps) {
  if (tier === "FREE") return null;
  const config = TIER_CONFIG[tier];
  if (!config) return null;

  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span className={`${config.bg} ${config.text} ${sizeClass} rounded-full font-medium`}>
      {config.label}
    </span>
  );
}
