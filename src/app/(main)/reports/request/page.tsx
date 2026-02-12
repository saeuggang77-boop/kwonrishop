"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search, SlidersHorizontal, MapPin, Store, Building, Wallet,
  TrendingUp, FileText, Check, Crown, Star, ChevronDown, Loader2,
  PenLine, List,
} from "lucide-react";
import { BUSINESS_CATEGORY_LABELS, REGIONS } from "@/lib/utils/constants";
import { formatKRW } from "@/lib/utils/format";
import { useToast } from "@/components/ui/toast";

interface ListingCard {
  id: string;
  title: string;
  address: string;
  businessCategory: string;
  price: string;
  premiumFee: string | null;
  monthlyRent: string | null;
  images: { url: string; thumbnailUrl: string | null }[];
}

interface PlanData {
  id: string;
  name: string;
  displayName: string;
  price: number;
  features: string[];
}

type Tab = "search" | "direct";

export default function ReportRequestIndexPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("search");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="font-heading text-2xl font-bold text-[#0B3B57]">
          권리분석 리포트 신청
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          매물을 선택하거나 직접 정보를 입력하여 리포트를 신청하세요
        </p>
      </div>

      {/* Tab switcher */}
      <div className="mb-6 flex rounded-xl border border-gray-200 bg-gray-50 p-1">
        <button
          onClick={() => setTab("search")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition-all ${
            tab === "search"
              ? "bg-white text-[#0B3B57] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <List className="h-4 w-4" />
          매물 선택
        </button>
        <button
          onClick={() => setTab("direct")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition-all ${
            tab === "direct"
              ? "bg-white text-[#0B3B57] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <PenLine className="h-4 w-4" />
          직접 입력
        </button>
      </div>

      {tab === "search" ? <SearchTab router={router} /> : <DirectInputTab router={router} toast={toast} />}
    </div>
  );
}

/* ========== Tab 1: 매물 선택 ========== */

function SearchTab({ router }: { router: ReturnType<typeof useRouter> }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  const fetchListings = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      if (category) params.set("businessCategory", category);
      params.set("limit", "8");
      if (!reset && cursor) params.set("cursor", cursor);

      const res = await fetch(`/api/listings?${params}`);
      const json = await res.json();
      const data = json.data ?? [];
      setListings((prev) => (reset ? data : [...prev, ...data]));
      setHasMore(json.meta?.hasMore ?? false);
      setCursor(json.meta?.cursor ?? null);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [query, category, cursor]);

  useEffect(() => {
    fetchListings(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    setCursor(null);
    fetchListings(true);
  };

  return (
    <div>
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="상호명 또는 주소로 검색"
            className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-[#2EC4B6] focus:ring-1 focus:ring-[#2EC4B6]"
          />
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`flex items-center gap-1 rounded-xl border px-4 text-sm font-medium transition-colors ${
            showFilter || category
              ? "border-[#2EC4B6] bg-[#2EC4B6]/10 text-[#0B3B57]"
              : "border-gray-200 text-gray-600 hover:border-gray-300"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">필터</span>
        </button>
        <button
          onClick={handleSearch}
          className="rounded-xl bg-[#2EC4B6] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#28b0a3]"
        >
          검색
        </button>
      </div>

      {/* Filter dropdown */}
      {showFilter && (
        <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-gray-700">업종 필터</label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm outline-none focus:border-[#2EC4B6] focus:ring-1 focus:ring-[#2EC4B6]"
            >
              <option value="">전체 업종</option>
              {Object.entries(BUSINESS_CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      )}

      {/* Listings grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {listings.map((listing) => (
          <button
            key={listing.id}
            onClick={() => router.push(`/reports/request/${listing.id}`)}
            className="group rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-[#2EC4B6] hover:shadow-md"
          >
            {/* Thumbnail */}
            <div className="mb-3 aspect-[16/10] overflow-hidden rounded-lg bg-gray-100">
              {listing.images?.[0] ? (
                <Image
                  src={listing.images[0].thumbnailUrl || listing.images[0].url}
                  alt={listing.title}
                  width={400}
                  height={250}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-300">
                  <Store className="h-10 w-10" />
                </div>
              )}
            </div>
            {/* Info */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#2EC4B6]/10 px-2 py-0.5 text-xs font-medium text-[#0B3B57]">
                  {BUSINESS_CATEGORY_LABELS[listing.businessCategory] ?? listing.businessCategory}
                </span>
              </div>
              <h3 className="truncate text-sm font-semibold text-gray-900">{listing.title}</h3>
              <p className="flex items-center gap-1 truncate text-xs text-gray-500">
                <MapPin className="h-3 w-3 shrink-0" />
                {listing.address}
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
                <span>보증금 {formatKRW(Number(listing.price))}</span>
                {listing.premiumFee && <span>권리금 {formatKRW(Number(listing.premiumFee))}</span>}
              </div>
            </div>
          </button>
        ))}
      </div>

      {listings.length === 0 && !loading && (
        <div className="mt-12 text-center text-sm text-gray-400">
          검색 결과가 없습니다.
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="mt-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#2EC4B6]" />
        </div>
      )}

      {/* Load more */}
      {hasMore && !loading && (
        <div className="mt-6 text-center">
          <button
            onClick={() => fetchListings(false)}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            더보기
          </button>
        </div>
      )}
    </div>
  );
}

/* ========== Tab 2: 직접 입력 ========== */

function DirectInputTab({
  router,
  toast,
}: {
  router: ReturnType<typeof useRouter>;
  toast: (type: "success" | "error" | "info", message: string) => void;
}) {
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [businessCategory, setBusinessCategory] = useState("");
  const [businessSubtype, setBusinessSubtype] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [floor, setFloor] = useState(1);
  const [areaPyeong, setAreaPyeong] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [monthlyRent, setMonthlyRent] = useState(0);
  const [managementFee, setManagementFee] = useState(0);
  const [interiorCost, setInteriorCost] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [monthlyProfit, setMonthlyProfit] = useState(0);
  const [premiumFee, setPremiumFee] = useState(0);

  useEffect(() => {
    fetch("/api/report-plans")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setPlans(json.data);
      })
      .catch(() => {});
  }, []);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const handleSubmit = async () => {
    if (!businessCategory) {
      toast("info", "업종을 선택해주세요.");
      return;
    }
    if (!selectedPlanId) {
      toast("info", "플랜을 선택해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/report-purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: null,
          planId: selectedPlanId,
          paymentMethod: "card",
          inputData: {
            businessCategory,
            businessSubtype,
            city,
            district,
            floor,
            areaPyeong,
            deposit,
            monthlyRent,
            managementFee,
            interiorCost,
            monthlyRevenue,
            monthlyProfit,
            premiumFee,
          },
        }),
      });
      const json = await res.json();
      if (json.data?.purchaseId) {
        router.push(`/reports/${json.data.purchaseId}`);
      } else {
        toast("error", json.error?.message ?? "오류가 발생했습니다.");
      }
    } catch {
      toast("error", "처리 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 기본 정보 */}
      <Section icon={<Store className="h-5 w-5" />} title="기본 정보">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">업종</label>
            <div className="relative">
              <select
                value={businessCategory}
                onChange={(e) => setBusinessCategory(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-[#2EC4B6] focus:ring-1 focus:ring-[#2EC4B6]"
              >
                <option value="">업종 선택</option>
                {Object.entries(BUSINESS_CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">세부업종</label>
            <input
              type="text"
              value={businessSubtype}
              onChange={(e) => setBusinessSubtype(e.target.value)}
              placeholder="예: 카페, 삼겹살 전문점"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#2EC4B6] focus:ring-1 focus:ring-[#2EC4B6]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">시/도</label>
              <div className="relative">
                <select
                  value={city}
                  onChange={(e) => { setCity(e.target.value); setDistrict(""); }}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-[#2EC4B6] focus:ring-1 focus:ring-[#2EC4B6]"
                >
                  <option value="">시/도 선택</option>
                  {Object.keys(REGIONS).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">구/군</label>
              <div className="relative">
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={!city}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-[#2EC4B6] focus:ring-1 focus:ring-[#2EC4B6] disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">구/군 선택</option>
                  {(REGIONS[city] ?? []).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">층수</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={floor}
                  onChange={(e) => setFloor(parseInt(e.target.value) || 1)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#2EC4B6] focus:ring-1 focus:ring-[#2EC4B6]"
                />
                <span className="shrink-0 text-sm text-gray-600">층</span>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">면적</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={areaPyeong}
                  onChange={(e) => setAreaPyeong(parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#2EC4B6] focus:ring-1 focus:ring-[#2EC4B6]"
                />
                <span className="shrink-0 text-sm text-gray-600">평</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 비용 정보 */}
      <Section icon={<Wallet className="h-5 w-5" />} title="비용 정보">
        <div className="grid grid-cols-2 gap-4">
          <WonField label="보증금" value={deposit} onChange={setDeposit} />
          <WonField label="월세" value={monthlyRent} onChange={setMonthlyRent} />
          <WonField label="관리비" value={managementFee} onChange={setManagementFee} />
          <WonField label="인테리어 비용" value={interiorCost} onChange={setInteriorCost} />
        </div>
      </Section>

      {/* 수익 정보 */}
      <Section icon={<TrendingUp className="h-5 w-5" />} title="수익 정보">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <WonField label="월매출" value={monthlyRevenue} onChange={setMonthlyRevenue} />
          <WonField label="월순이익" value={monthlyProfit} onChange={setMonthlyProfit} />
          <WonField label="권리금" value={premiumFee} onChange={setPremiumFee} />
        </div>
      </Section>

      {/* 플랜 선택 */}
      <Section icon={<Crown className="h-5 w-5" />} title="플랜 선택">
        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((plan) => {
            const isPremium = plan.name === "PREMIUM";
            const isSelected = selectedPlanId === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`relative cursor-pointer rounded-xl border-2 p-5 transition-all ${
                  isSelected
                    ? "border-[#2EC4B6] bg-[#2EC4B6]/5 shadow-lg"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {isPremium && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#2EC4B6] px-3 py-0.5 text-xs font-bold text-white">
                    추천
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <div className={`rounded-lg p-2 ${isPremium ? "bg-[#2EC4B6]/10 text-[#0B3B57]" : "bg-gray-100 text-gray-700"}`}>
                    {isPremium ? <Star className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                  </div>
                  <h3 className="text-lg font-bold text-[#0B3B57]">{plan.displayName}</h3>
                </div>
                <p className="mt-3 text-2xl font-bold text-[#0B3B57]">
                  {formatKRW(plan.price)}
                </p>
                <ul className="mt-4 space-y-2">
                  {(plan.features as string[]).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2EC4B6]" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {selectedPlan && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">결제 금액</span>
              <span className="text-xl font-bold text-[#0B3B57]">{formatKRW(selectedPlan.price)}</span>
            </div>
          </div>
        )}
      </Section>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!businessCategory || !selectedPlanId || submitting}
        className="w-full rounded-xl bg-[#2EC4B6] py-4 text-lg font-medium text-white transition-colors hover:bg-[#28b0a3] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            처리 중...
          </span>
        ) : (
          "분석 리포트 신청하기"
        )}
      </button>
      <p className="mt-2 text-center text-xs text-gray-500">
        결제 완료 후 즉시 분석 리포트가 제공됩니다.
      </p>
    </div>
  );
}

/* ========== Shared Components ========== */

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2EC4B6]/10 text-[#0B3B57]">
          {icon}
        </div>
        <h2 className="text-lg font-bold text-[#0B3B57]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function WonField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          min={0}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#2EC4B6] focus:ring-1 focus:ring-[#2EC4B6]"
        />
        <span className="shrink-0 text-sm text-gray-600">만원</span>
      </div>
    </div>
  );
}
