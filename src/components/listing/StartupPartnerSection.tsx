"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

// ===== Types =====

interface TabConfig {
  type: "franchise" | "partner" | "equipment";
  label: string;
  minTier?: string;
}

interface SameTypeConfig {
  type: "franchise" | "partner" | "equipment";
  id: string;
  title: string;
  viewAllLink: string;
}

interface StartupPartnerSectionProps {
  tabs?: TabConfig[];
  sameType?: SameTypeConfig;
}

interface RecommendItem {
  id: string;
  href: string;
  imageUrl: string | null;
  title: string;
  subtitle: string;
  icon: string;
}

// ===== Emoji & Label Maps =====

function getIndustryEmoji(industry?: string): string {
  if (!industry) return "🏢";
  if (industry.includes("외식") || industry.includes("음식") || industry.includes("커피") || industry.includes("카페")) return "🍽️";
  if (industry.includes("교육") || industry.includes("학원")) return "📚";
  if (industry.includes("미용") || industry.includes("뷰티")) return "💇";
  if (industry.includes("세탁") || industry.includes("빨래")) return "👔";
  if (industry.includes("편의점") || industry.includes("유통") || industry.includes("소매")) return "🏪";
  if (industry.includes("헬스") || industry.includes("피트니스")) return "💪";
  return "🏢";
}

const SERVICE_ICONS: Record<string, string> = {
  INTERIOR: "🏗️", SIGNAGE: "🪧", EQUIPMENT: "🔧", CLEANING: "🧹",
  ACCOUNTING: "📊", LEGAL: "📋", POS_SYSTEM: "💻", DELIVERY: "🚚",
  MARKETING: "📢", CONSULTING: "💼", OTHER: "🔹",
};

const SERVICE_LABELS: Record<string, string> = {
  INTERIOR: "인테리어/시공", SIGNAGE: "간판/사인", EQUIPMENT: "주방설비", CLEANING: "청소/방역",
  ACCOUNTING: "세무/회계", LEGAL: "법률/컨설팅", POS_SYSTEM: "POS/키오스크", DELIVERY: "배달/포장",
  MARKETING: "마케팅/홍보", CONSULTING: "경영컨설팅", OTHER: "기타",
};

const EQUIP_ICONS: Record<string, string> = {
  REFRIGERATION: "❄️", KITCHEN: "🍳", TABLE_CHAIR: "🪑", POS_ELECTRONIC: "💻",
  DISPLAY: "🗄️", SIGN_INTERIOR: "🪧", PACKAGING: "📦", CLEANING: "🧹",
  BEVERAGE: "🧋", OTHER: "🔧",
};

const EQUIP_LABELS: Record<string, string> = {
  REFRIGERATION: "냉장/냉동", KITCHEN: "주방설비", TABLE_CHAIR: "테이블/의자",
  POS_ELECTRONIC: "POS/전자", DISPLAY: "진열/매대", SIGN_INTERIOR: "간판/인테리어",
  PACKAGING: "포장용품", CLEANING: "청소용품", BEVERAGE: "음료설비", OTHER: "기타",
};

// ===== Data Helpers =====

function getTabApiUrl(tab: TabConfig): string {
  const tierParam = tab.minTier ? `&minTier=${tab.minTier}` : "";
  if (tab.type === "franchise") return `/api/franchise?featured=true&limit=3${tierParam}`;
  if (tab.type === "partner") return `/api/partners?featured=true&limit=3${tierParam}`;
  if (tab.type === "equipment") return `/api/equipment?featured=true&limit=3${tierParam}`;
  return "";
}

function extractTabItems(type: string, data: any): any[] {
  if (type === "franchise") return (data.brands || []).slice(0, 3);
  if (type === "partner") return (data.partners || []).slice(0, 3);
  if (type === "equipment") return (data.equipment || []).slice(0, 3);
  return [];
}

function extractSameTypeItems(type: string, data: any): RecommendItem[] {
  let raw: any[] = [];
  if (type === "franchise") raw = data.franchises || [];
  else if (type === "partner") raw = data.partners || [];
  else if (type === "equipment") raw = data.equipments || [];

  return raw.slice(0, 4).map((item: any) => {
    if (type === "franchise") {
      return {
        id: item.id, href: `/franchise/${item.id}`, imageUrl: null,
        title: item.brandName,
        subtitle: [item.industry, item.totalStores && `${item.totalStores.toLocaleString()}개점`].filter(Boolean).join(" · "),
        icon: getIndustryEmoji(item.industry),
      };
    } else if (type === "partner") {
      return {
        id: item.id, href: `/partners/${item.id}`, imageUrl: item.images?.[0]?.url || null,
        title: item.companyName,
        subtitle: [SERVICE_LABELS[item.serviceType] || "기타", ...(item.serviceArea?.slice(0, 2) || [])].join(" · "),
        icon: SERVICE_ICONS[item.serviceType] || "🔹",
      };
    } else {
      return {
        id: item.id, href: `/equipment/${item.id}`, imageUrl: item.images?.[0]?.url || null,
        title: item.title,
        subtitle: [EQUIP_LABELS[item.category] || "기타", item.price === 0 ? "무료 나눔" : `${item.price?.toLocaleString()}원`].filter(Boolean).join(" · "),
        icon: EQUIP_ICONS[item.category] || "🔧",
      };
    }
  });
}

function getItemIcon(type: string, item: any): string {
  if (type === "franchise") return getIndustryEmoji(item.industry);
  if (type === "partner") return SERVICE_ICONS[item.serviceType] || "🔹";
  if (type === "equipment") return EQUIP_ICONS[item.category] || "🔧";
  return "🔹";
}

function getItemImageUrl(type: string, item: any): string | null {
  if (type === "franchise") return item.logo || null;
  if (type === "partner") return item.images?.[0]?.url || null;
  if (type === "equipment") return item.images?.[0]?.url || null;
  return null;
}

function getItemName(type: string, item: any): string {
  if (type === "franchise") return item.brandName;
  if (type === "partner") return item.companyName;
  if (type === "equipment") return item.title;
  return "";
}

function getItemHref(type: string, item: any): string {
  if (type === "franchise") return `/franchise/${item.id}`;
  if (type === "partner") return `/partners/${item.id}`;
  if (type === "equipment") return `/equipment/${item.id}`;
  return "#";
}

function getItemSubtitle(type: string, item: any): string {
  if (type === "franchise") {
    return [item.franchiseFee && `가맹비 ${item.franchiseFee}만`, item.industry].filter(Boolean).join(" · ");
  }
  if (type === "partner") {
    return [SERVICE_LABELS[item.serviceType] || "기타", item.description?.slice(0, 20)].filter(Boolean).join(" · ");
  }
  if (type === "equipment") {
    return [EQUIP_LABELS[item.category] || "기타", item.price === 0 ? "무료 나눔" : `${item.price?.toLocaleString()}원`].filter(Boolean).join(" · ");
  }
  return "";
}

function getTierBadge(type: string, idx: number): string {
  if (type === "franchise") return ["골드", "실버", "브론즈"][idx] || "브론즈";
  return ["VIP", "프리미엄", "베이직"][idx] || "베이직";
}

function getItemExtra(type: string, item: any): string | null {
  if (type === "franchise" && item.totalStores) return `전국 ${item.totalStores.toLocaleString()}개점`;
  return null;
}

const VIEW_ALL: Record<string, { link: string; label: string }> = {
  franchise: { link: "/franchise", label: "프랜차이즈 전체보기" },
  partner: { link: "/partners", label: "협력업체 전체보기" },
  equipment: { link: "/equipment", label: "집기장터 전체보기" },
};

// ===== Main Component =====

export default function StartupPartnerSection({
  tabs = [
    { type: "franchise", label: "추천 프랜차이즈" },
    { type: "partner", label: "협력업체" },
  ],
  sameType,
}: StartupPartnerSectionProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [tabData, setTabData] = useState<Record<string, any[]>>({});
  const [sameTypeItems, setSameTypeItems] = useState<RecommendItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const promises: Promise<void>[] = [];

        if (sameType) {
          promises.push(
            fetch(`/api/recommendations?type=${sameType.type}&id=${sameType.id}&limit=4`)
              .then((r) => (r.ok ? r.json() : null))
              .then((data) => { if (data) setSameTypeItems(extractSameTypeItems(sameType.type, data)); })
              .catch(() => {})
          );
        }

        for (const tab of tabs) {
          promises.push(
            fetch(getTabApiUrl(tab))
              .then((r) => (r.ok ? r.json() : null))
              .then((data) => {
                if (data) setTabData((prev) => ({ ...prev, [tab.type]: extractTabItems(tab.type, data) }));
              })
              .catch(() => {})
          );
        }

        await Promise.allSettled(promises);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const hasTabData = tabs.some((tab) => (tabData[tab.type]?.length ?? 0) > 0);
  const hasSameType = sameTypeItems.length > 0;

  if (!loading && !hasTabData && !hasSameType) return null;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 md:pt-8">
      {/* ===== 같은 종류 추천 (sameType 있을 때만) ===== */}
      {hasSameType && sameType && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{sameType.title}</h3>
            <Link href={sameType.viewAllLink} className="text-sm text-navy-700 hover:text-navy-700">전체보기 →</Link>
          </div>
          <div className="grid grid-cols-2 gap-2.5 md:hidden">
            {sameTypeItems.slice(0, 2).map((item) => <SameTypeCard key={item.id} item={item} />)}
          </div>
          <div className="hidden md:grid md:grid-cols-4 md:gap-4">
            {sameTypeItems.slice(0, 4).map((item) => <SameTypeCard key={item.id} item={item} />)}
          </div>
        </div>
      )}

      {hasSameType && hasTabData && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-0" />
      )}

      {/* ===== 창업 파트너 (탭 섹션) ===== */}
      {(hasTabData || loading) && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">창업 파트너</h3>
            <span className="px-1.5 py-0.5 bg-navy-100 dark:bg-blue-900 text-navy-700 dark:text-navy-400 text-[10px] font-semibold rounded">AD</span>
          </div>

          <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-700 mb-4">
            {tabs.map((tab, i) => (
              <button
                key={tab.type}
                onClick={() => setActiveTab(i)}
                className={`pb-2 text-sm transition-colors ${
                  activeTab === i
                    ? "text-navy-700 font-semibold border-b-2 border-navy-600"
                    : "text-gray-400 font-medium border-b-2 border-transparent"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
            </div>
          )}

          {!loading && tabs.map((tab, i) => {
            if (activeTab !== i) return null;
            const items = tabData[tab.type] || [];
            if (items.length === 0) {
              return <div key={tab.type} className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">등록된 항목이 없습니다</div>;
            }
            return (
              <div key={tab.type}>
                <div className="space-y-3 md:hidden">
                  {items.map((item: any, idx: number) => (
                    <TierCardMobile
                      key={item.id}
                      href={getItemHref(tab.type, item)}
                      icon={getItemIcon(tab.type, item)}
                      imageUrl={getItemImageUrl(tab.type, item)}
                      name={getItemName(tab.type, item)}
                      badge={getTierBadge(tab.type, idx)}
                      subtitle={getItemSubtitle(tab.type, item)}
                      tierLevel={(idx === 0 ? 1 : idx === 1 ? 2 : 3) as 1 | 2 | 3}
                    />
                  ))}
                </div>
                <div className="hidden md:grid md:grid-cols-3 md:gap-4">
                  {items.map((item: any, idx: number) => (
                    <TierCardPC
                      key={item.id}
                      href={getItemHref(tab.type, item)}
                      icon={getItemIcon(tab.type, item)}
                      imageUrl={getItemImageUrl(tab.type, item)}
                      name={getItemName(tab.type, item)}
                      badge={getTierBadge(tab.type, idx)}
                      subtitle={getItemSubtitle(tab.type, item)}
                      extra={getItemExtra(tab.type, item)}
                      tierLevel={(idx === 0 ? 1 : idx === 1 ? 2 : 3) as 1 | 2 | 3}
                    />
                  ))}
                </div>
                <Link href={VIEW_ALL[tab.type]?.link || "/"} className="block text-center text-sm text-navy-700 font-medium mt-3 hover:underline">
                  {VIEW_ALL[tab.type]?.label || "전체보기"} →
                </Link>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ===== Same-Type Card =====

function SameTypeCard({ item }: { item: RecommendItem }) {
  return (
    <Link href={item.href} className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-700 relative">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.title} fill className="object-cover" sizes="(max-width:768px) 50vw, 25vw" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">{item.icon}</div>
        )}
      </div>
      <div className="p-2.5 md:p-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{item.subtitle}</p>
      </div>
    </Link>
  );
}

// ===== Tier Cards =====

const TIER_MOBILE_STYLES = {
  1: {
    card: "p-4 border-2 border-navy-300 bg-white dark:bg-gray-800",
    icon: "w-16 h-16 rounded-xl bg-gray-50 dark:bg-gray-700 text-3xl",
    name: "text-base",
    badge: "px-2 py-0.5 bg-navy-700 text-white text-[9px] font-bold rounded",
    arrow: "text-navy-300 w-5 h-5",
  },
  2: {
    card: "p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
    icon: "w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-700 text-2xl",
    name: "text-sm",
    badge: "px-1.5 py-0.5 bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300 text-[9px] font-bold rounded",
    arrow: "text-gray-300 w-4 h-4",
  },
  3: {
    card: "px-3 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
    icon: "w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-700 text-lg",
    name: "text-[13px]",
    badge: "px-1 py-0.5 bg-gray-100 text-gray-500 dark:bg-gray-600 dark:text-gray-400 text-[8px] font-bold rounded",
    arrow: "text-gray-200 w-4 h-4",
  },
} as const;

const TIER_PC_STYLES = {
  1: {
    card: "p-5 border-2 border-navy-300 bg-white dark:bg-gray-800",
    icon: "w-20 h-20 rounded-2xl bg-gray-50 dark:bg-gray-700 text-4xl",
    name: "text-base",
    badge: "px-2 py-0.5 bg-navy-700 text-white text-[9px] font-bold rounded",
  },
  2: {
    card: "p-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
    icon: "w-16 h-16 rounded-xl bg-gray-50 dark:bg-gray-700 text-3xl",
    name: "text-sm",
    badge: "px-1.5 py-0.5 bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300 text-[9px] font-bold rounded",
  },
  3: {
    card: "p-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
    icon: "w-12 h-12 rounded-lg bg-gray-50 dark:bg-gray-700 text-2xl",
    name: "text-sm",
    badge: "px-1.5 py-0.5 bg-gray-100 text-gray-500 dark:bg-gray-600 dark:text-gray-400 text-[8px] font-bold rounded",
  },
} as const;

function TierCardMobile({ href, icon, imageUrl, name, badge, subtitle, tierLevel }: {
  href: string; icon: string; imageUrl?: string | null; name: string; badge: string; subtitle: string; tierLevel: 1 | 2 | 3;
}) {
  const s = TIER_MOBILE_STYLES[tierLevel];
  return (
    <Link href={href} className={`block rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${s.card}`}>
      <div className="flex items-center gap-3">
        <div className={`shrink-0 flex items-center justify-center overflow-hidden ${s.icon}`}>
          {imageUrl ? (
            <Image src={imageUrl} alt={name} width={64} height={64} className="w-full h-full object-cover" />
          ) : (
            icon
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className={`font-bold text-gray-900 dark:text-white ${s.name}`}>{name}</p>
            <span className={s.badge}>{badge}</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 truncate">{subtitle}</p>
        </div>
        <ChevronRight className={s.arrow} />
      </div>
    </Link>
  );
}

function TierCardPC({ href, icon, imageUrl, name, badge, subtitle, extra, tierLevel }: {
  href: string; icon: string; imageUrl?: string | null; name: string; badge: string; subtitle: string; extra?: string | null; tierLevel: 1 | 2 | 3;
}) {
  const s = TIER_PC_STYLES[tierLevel];
  return (
    <Link href={href} className={`flex flex-col items-center text-center rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${s.card}`}>
      <div className={`flex items-center justify-center mb-3 overflow-hidden ${s.icon}`}>
        {imageUrl ? (
          <Image src={imageUrl} alt={name} width={80} height={80} className="w-full h-full object-cover" />
        ) : (
          icon
        )}
      </div>
      <div className="flex items-center gap-1.5 mb-1">
        <p className={`font-bold text-gray-900 dark:text-white ${s.name}`}>{name}</p>
        <span className={s.badge}>{badge}</span>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400">{subtitle}</p>
      {extra && <p className="text-[10px] text-gray-500 mt-1">{extra}</p>}
    </Link>
  );
}
