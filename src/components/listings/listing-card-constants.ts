/** Shared visual constants for ListingCard variants */

export const CATEGORY_EMOJI: Record<string, string> = {
  CAFE_BAKERY: "☕", CHICKEN: "🍗", KOREAN_FOOD: "🍚", PIZZA: "🍕",
  BUNSIK: "🍜", RETAIL: "🏪", BAR_PUB: "🍺", WESTERN_FOOD: "🍝",
  JAPANESE_FOOD: "🍣", CHINESE_FOOD: "🥟", SERVICE: "✂️",
  ENTERTAINMENT: "🎮", EDUCATION: "📚", DELIVERY: "🛵", ACCOMMODATION: "🏨",
};

/** Light gradients for premium/recommended card no-image fallback */
export const CATEGORY_GRADIENT: Record<string, string> = {
  CAFE_BAKERY: "from-[#FEF3C7] to-[#FDE68A]",
  CHICKEN: "from-[#FFEDD5] to-[#FDBA74]",
  KOREAN_FOOD: "from-[#FEF9C3] to-[#FDE047]",
  PIZZA: "from-[#FFE4E6] to-[#FDA4AF]",
  BUNSIK: "from-[#FEF3C7] to-[#FCD34D]",
  RETAIL: "from-[#E0F2FE] to-[#7DD3FC]",
  BAR_PUB: "from-[#EDE9FE] to-[#C4B5FD]",
  WESTERN_FOOD: "from-[#FCE7F3] to-[#F9A8D4]",
  JAPANESE_FOOD: "from-[#FFEDD5] to-[#FB923C]",
  CHINESE_FOOD: "from-[#FEE2E2] to-[#FCA5A5]",
  SERVICE: "from-[#DBEAFE] to-[#93C5FD]",
  ENTERTAINMENT: "from-[#E0E7FF] to-[#A5B4FC]",
  EDUCATION: "from-[#D1FAE5] to-[#6EE7B7]",
  DELIVERY: "from-[#E0F2FE] to-[#7DD3FC]",
  ACCOMMODATION: "from-[#F3E8FF] to-[#C084FC]",
};

/** Dark gradient overlays for horizontal card no-image fallback */
export const CATEGORY_PLACEHOLDER: Record<string, { gradient: string; icon: string }> = {
  CAFE_BAKERY:   { gradient: "from-amber-800/70 to-amber-600/50", icon: "☕" },
  CHICKEN:       { gradient: "from-orange-600/70 to-orange-400/50", icon: "🍗" },
  KOREAN_FOOD:   { gradient: "from-red-700/70 to-red-500/50", icon: "🍚" },
  PIZZA:         { gradient: "from-yellow-600/70 to-yellow-400/50", icon: "🍕" },
  SNACK_BAR:     { gradient: "from-pink-600/70 to-pink-400/50", icon: "🍜" },
  RETAIL:        { gradient: "from-blue-700/70 to-blue-500/50", icon: "🏪" },
  BAR_PUB:       { gradient: "from-purple-700/70 to-purple-500/50", icon: "🍺" },
  WESTERN_FOOD:  { gradient: "from-rose-700/70 to-rose-500/50", icon: "🍝" },
  SERVICE:       { gradient: "from-blue-800/70 to-blue-600/50", icon: "✂️" },
  ENTERTAINMENT: { gradient: "from-indigo-700/70 to-indigo-500/50", icon: "🎮" },
  EDUCATION:     { gradient: "from-cyan-700/70 to-cyan-500/50", icon: "📚" },
};
