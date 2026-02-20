// Category mappings for Kakao Local API category codes
// FD6=음식점, CE7=카페, CS2=편의점, MT1=대형마트, PM9=약국,
// BK9=은행, HP8=병원, CT1=문화시설, AT4=관광명소, AD5=숙박,
// SC4=학교, SW8=지하철역, OL7=주유소, PK6=주차장

export const KAKAO_CATEGORY_MAP: Record<string, { code: string; label: string; color: string }> = {
  food: { code: "FD6", label: "음식점", color: "#FF6B35" },
  cafe: { code: "CE7", label: "카페", color: "#8B4513" },
  convenience: { code: "CS2", label: "편의점", color: "#4169E1" },
  mart: { code: "MT1", label: "대형마트", color: "#228B22" },
  pharmacy: { code: "PM9", label: "약국", color: "#DC143C" },
  hospital: { code: "HP8", label: "병원", color: "#FF69B4" },
  school: { code: "SC4", label: "학교", color: "#9370DB" },
  subway: { code: "SW8", label: "지하철역", color: "#20B2AA" },
};

// Types
export interface NearbyPlace {
  id: string;
  name: string;
  category: string;
  categoryKey: string;
  address: string;
  phone: string;
  distance: number;
  x: string;  // longitude
  y: string;  // latitude
}

export interface NearbyResult {
  categoryKey: string;
  categoryLabel: string;
  count: number;
  places: NearbyPlace[];
}

export interface StoreStats {
  total: number;
  byCategory: { name: string; count: number; color: string }[];
  openRate: number;   // 개업률
  closeRate: number;  // 폐업률
}

export interface SeoulData {
  footTraffic: { dayOfWeek: string; count: number }[];
  estimatedSales: { category: string; amount: number }[];
  quarterLabel: string;
}

export interface AnalysisResult {
  nearby: NearbyResult[];
  stores: StoreStats | null;
  seoul: SeoulData | null;
  isSeoul: boolean;
}

// Helper: Get current quarter string for Seoul API (e.g., "20254" for 2025 Q4)
// Seoul API data is usually 2 quarters behind
export function getSeoulQuarter(): string {
  const now = new Date();
  let year = now.getFullYear();
  let quarter = Math.ceil((now.getMonth() + 1) / 3);
  // Go back 2 quarters for data availability
  quarter -= 2;
  if (quarter <= 0) {
    quarter += 4;
    year -= 1;
  }
  return `${year}${quarter}`;
}

// Helper: Check if address is in Seoul
export function isSeoulAddress(address: string): boolean {
  return address.startsWith("서울") || address.includes("서울특별시");
}

// Chart colors for category distribution
export const CHART_COLORS = [
  "#FF6B35", "#8B4513", "#4169E1", "#228B22", "#DC143C",
  "#FF69B4", "#9370DB", "#20B2AA", "#FFD700", "#708090",
];

// Radius options
export const RADIUS_OPTIONS = [
  { value: 300, label: "300m" },
  { value: 500, label: "500m" },
  { value: 1000, label: "1km" },
] as const;
