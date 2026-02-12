"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, MapPin, Store, Clock, Building, Layers,
  Wallet, PaintBucket, Users, TrendingUp, FileText, Check, Crown, Star,
} from "lucide-react";
import { BUSINESS_CATEGORY_LABELS } from "@/lib/utils/constants";
import { formatKRW } from "@/lib/utils/format";
import { useToast } from "@/components/ui/toast";

const TOTAL_STEPS = 8;

interface ListingData {
  id: string;
  title: string;
  address: string;
  businessCategory: string;
  businessSubtype: string | null;
  price: number;
  monthlyRent: number | null;
  premiumFee: number | null;
  managementFee: number | null;
  monthlyRevenue: number | null;
  monthlyProfit: number | null;
  operatingYears: number | null;
  areaM2: number | null;
  floor: number | null;
}

interface PlanData {
  id: string;
  name: string;
  displayName: string;
  price: number;
  features: string[];
}

const CUSTOMER_TYPES = ["직장인", "학생", "주부", "관광객", "배달고객", "기타"];

export default function ReportRequestPage({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [listing, setListing] = useState<ListingData | null>(null);
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [businessCategory, setBusinessCategory] = useState("");
  const [businessSubtype, setBusinessSubtype] = useState("");
  const [operatingYears, setOperatingYears] = useState(0);
  const [operatingMonths, setOperatingMonths] = useState(0);
  const [floor, setFloor] = useState(1);
  const [isBasement, setIsBasement] = useState(false);
  const [areaPyeong, setAreaPyeong] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [monthlyRent, setMonthlyRent] = useState(0);
  const [managementFee, setManagementFee] = useState(0);
  const [interiorCost, setInteriorCost] = useState(0);
  const [interiorPeriod, setInteriorPeriod] = useState("1~3년");
  const [staffCount, setStaffCount] = useState(0);
  const [staffCost, setStaffCost] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [monthlyProfit, setMonthlyProfit] = useState(0);
  const [customerTypes, setCustomerTypes] = useState<string[]>([]);
  const [premiumFee, setPremiumFee] = useState(0);
  const [leaseRemainYears, setLeaseRemainYears] = useState(0);
  const [leaseRemainMonths, setLeaseRemainMonths] = useState(0);
  const [renewalStatus, setRenewalStatus] = useState<"가능" | "불가" | "미정">("미정");
  const [selectedPlanId, setSelectedPlanId] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/listings/${listingId}`).then((r) => r.json()),
      fetch("/api/report-plans").then((r) => r.json()),
    ])
      .then(([listingRes, plansRes]) => {
        const l = listingRes.data;
        if (l) {
          setListing(l);
          setBusinessCategory(l.businessCategory ?? "");
          setBusinessSubtype(l.businessSubtype ?? "");
          setOperatingYears(l.operatingYears ?? 0);
          setFloor(l.floor ?? 1);
          setAreaPyeong(l.areaM2 ? Math.round(l.areaM2 / 3.3058) : 0);
          setDeposit(l.price ? Math.round(l.price / 10000) : 0);
          setMonthlyRent(l.monthlyRent ? Math.round(l.monthlyRent / 10000) : 0);
          setManagementFee(l.managementFee ? Math.round(l.managementFee / 10000) : 0);
          setMonthlyRevenue(l.monthlyRevenue ? Math.round(l.monthlyRevenue / 10000) : 0);
          setMonthlyProfit(l.monthlyProfit ? Math.round(l.monthlyProfit / 10000) : 0);
          setPremiumFee(l.premiumFee ? Math.round(l.premiumFee / 10000) : 0);
        }
        if (plansRes.data) {
          setPlans(plansRes.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [listingId]);

  const handleSubmit = async () => {
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
          listingId,
          planId: selectedPlanId,
          paymentMethod: "card",
          inputData: {
            businessCategory,
            businessSubtype,
            operatingYears,
            operatingMonths,
            floor: isBasement ? -floor : floor,
            areaPyeong,
            deposit,
            monthlyRent,
            managementFee,
            interiorCost,
            interiorPeriod,
            staffCount,
            staffCost,
            monthlyRevenue,
            monthlyProfit,
            customerTypes,
            premiumFee,
            leaseRemainYears,
            leaseRemainMonths,
            renewalStatus,
          },
        }),
      });
      const json = await res.json();
      if (json.data?.purchaseId) {
        router.push(`/reports/${json.data.purchaseId}`);
      } else {
        toast("error", "결제 처리 중 오류가 발생했습니다.");
      }
    } catch {
      toast("error", "결제 처리 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCustomerType = (type: string) => {
    setCustomerTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-gray-500">매물을 찾을 수 없습니다.</p>
        <Link href="/listings" className="mt-4 inline-block text-blue-600 hover:underline">
          매물 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const profitEstimateMin = Math.round(monthlyProfit * 0.8);
  const profitEstimateMax = Math.round(monthlyProfit * 1.2);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-blue-900">권리진단서 발급 신청</h1>
        <p className="mt-2 text-sm text-gray-500">정확한 분석을 위해 매물 정보를 입력해 주세요</p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="font-medium text-blue-600">Step {step}</span>
          <span>{step} / {TOTAL_STEPS}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {step === 1 && (
          <StepWrapper icon={<MapPin className="h-6 w-6" />} title="매물 확인">
            <div className="space-y-4">
              <InfoRow label="상호명" value={listing.title} />
              <InfoRow label="주소" value={listing.address} />
              <InfoRow label="업종" value={BUSINESS_CATEGORY_LABELS[listing.businessCategory] ?? listing.businessCategory} />
              <p className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
                아래 매물 정보를 기반으로 권리진단서를 발급합니다. 정보가 다를 경우 다음 단계에서 수정할 수 있습니다.
              </p>
            </div>
          </StepWrapper>
        )}

        {step === 2 && (
          <StepWrapper icon={<Store className="h-6 w-6" />} title="업종 + 운영 기간">
            <div className="space-y-6">
              <InputField
                label="업종 (대분류)"
                value={BUSINESS_CATEGORY_LABELS[businessCategory] ?? businessCategory}
                readOnly
              />
              <InputField
                label="세부업종"
                value={businessSubtype}
                onChange={(v) => setBusinessSubtype(v)}
                placeholder="예: 카페, 삼겹살 전문점"
              />
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">운영 기간</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <NumberInput value={operatingYears} onChange={setOperatingYears} min={0} max={50} />
                    <span className="text-sm text-gray-600">년</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <NumberInput value={operatingMonths} onChange={setOperatingMonths} min={0} max={11} />
                    <span className="text-sm text-gray-600">개월</span>
                  </div>
                </div>
              </div>
            </div>
          </StepWrapper>
        )}

        {step === 3 && (
          <StepWrapper icon={<Building className="h-6 w-6" />} title="층수 + 실평수">
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">층수</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={isBasement}
                      onChange={(e) => setIsBasement(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 accent-blue-600"
                    />
                    지하
                  </label>
                  <div className="flex items-center gap-2">
                    <NumberInput value={floor} onChange={setFloor} min={1} max={99} />
                    <span className="text-sm text-gray-600">층</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  <Layers className="mr-1 inline h-4 w-4" />
                  전용면적
                </label>
                <div className="flex items-center gap-2">
                  <NumberInput value={areaPyeong} onChange={setAreaPyeong} min={0} max={9999} />
                  <span className="text-sm text-gray-600">평</span>
                </div>
              </div>
            </div>
          </StepWrapper>
        )}

        {step === 4 && (
          <StepWrapper icon={<Wallet className="h-6 w-6" />} title="보증금 / 월임대료 / 월관리비">
            <div className="space-y-6">
              <WonInput label="보증금" value={deposit} onChange={setDeposit} />
              <WonInput label="월임대료 (월세)" value={monthlyRent} onChange={setMonthlyRent} />
              <WonInput label="월관리비" value={managementFee} onChange={setManagementFee} />
            </div>
          </StepWrapper>
        )}

        {step === 5 && (
          <StepWrapper icon={<PaintBucket className="h-6 w-6" />} title="인테리어 + 인건비">
            <div className="space-y-6">
              <WonInput label="인테리어 투자금액" value={interiorCost} onChange={setInteriorCost} />
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">시공 시기</label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {["1년이내", "1~3년", "3~5년", "5년이상"].map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setInteriorPeriod(period)}
                      className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                        interiorPeriod === period
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">직원 수</label>
                  <div className="flex items-center gap-2">
                    <NumberInput value={staffCount} onChange={setStaffCount} min={0} max={99} />
                    <span className="text-sm text-gray-600">명</span>
                  </div>
                </div>
                <WonInput label="월 인건비" value={staffCost} onChange={setStaffCost} />
              </div>
            </div>
          </StepWrapper>
        )}

        {step === 6 && (
          <StepWrapper icon={<TrendingUp className="h-6 w-6" />} title="매출 + 순이익 + 고객층">
            <div className="space-y-6">
              <WonInput label="월평균 매출" value={monthlyRevenue} onChange={setMonthlyRevenue} />
              <WonInput label="월평균 순이익" value={monthlyProfit} onChange={setMonthlyProfit} />

              {monthlyProfit > 0 && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm font-medium text-blue-800">예상 순수익 범위</p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-sm text-blue-600">{profitEstimateMin.toLocaleString()}만원</span>
                    <div className="flex-1">
                      <div className="relative h-3 rounded-full bg-blue-200">
                        <div className="absolute left-[20%] right-[20%] top-0 h-full rounded-full bg-blue-500" />
                        <div className="absolute left-1/2 top-1/2 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-800" />
                      </div>
                    </div>
                    <span className="text-sm text-blue-600">{profitEstimateMax.toLocaleString()}만원</span>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  <Users className="mr-1 inline h-4 w-4" />
                  주요 고객층 (다중선택)
                </label>
                <div className="flex flex-wrap gap-2">
                  {CUSTOMER_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleCustomerType(type)}
                      className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-all ${
                        customerTypes.includes(type)
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </StepWrapper>
        )}

        {step === 7 && (
          <StepWrapper icon={<FileText className="h-6 w-6" />} title="권리금 + 계약 정보">
            <div className="space-y-6">
              <WonInput label="권리금 희망금액" value={premiumFee} onChange={setPremiumFee} />
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">임대차 잔여 기간</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <NumberInput value={leaseRemainYears} onChange={setLeaseRemainYears} min={0} max={30} />
                    <span className="text-sm text-gray-600">년</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <NumberInput value={leaseRemainMonths} onChange={setLeaseRemainMonths} min={0} max={11} />
                    <span className="text-sm text-gray-600">개월</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">재계약 가능 여부</label>
                <div className="flex gap-3">
                  {(["가능", "불가", "미정"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setRenewalStatus(status)}
                      className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                        renewalStatus === status
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </StepWrapper>
        )}

        {step === 8 && (
          <StepWrapper icon={<Crown className="h-6 w-6" />} title="플랜 선택 & 결제">
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {plans.map((plan) => {
                  const isPremium = plan.name === "PREMIUM";
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 shadow-lg scale-[1.02]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {isPremium && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-bold text-white">
                          추천
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <div className={`rounded-lg p-2 ${isPremium ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                          {isPremium ? <Star className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                        </div>
                        <h3 className="text-lg font-bold text-blue-900">{plan.displayName}</h3>
                      </div>
                      <p className="mt-3 text-2xl font-bold text-blue-900">
                        {formatKRW(plan.price)}
                      </p>
                      <ul className="mt-4 space-y-2">
                        {(plan.features as string[]).map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              {selectedPlan && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">결제 금액</span>
                    <span className="text-xl font-bold text-blue-900">{formatKRW(selectedPlan.price)}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!selectedPlanId || submitting}
                className="w-full rounded-xl bg-blue-600 py-4 text-lg font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "처리 중..." : "권리진단서 발급받기"}
              </button>
              <p className="text-center text-xs text-gray-500">
                결제 완료 후 즉시 권리진단서가 발급됩니다.
              </p>
            </div>
          </StepWrapper>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
          이전으로
        </button>
        {step < TOTAL_STEPS && (
          <button
            onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            다음으로
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function StepWrapper({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
          {icon}
        </div>
        <h2 className="text-xl font-bold text-blue-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${readOnly ? "bg-gray-100 text-gray-500" : ""}`}
      />
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  min = 0,
  max = 999999,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => {
        const v = parseInt(e.target.value) || 0;
        onChange(Math.min(max, Math.max(min, v)));
      }}
      min={min}
      max={max}
      className="w-24 rounded-lg border border-gray-300 px-3 py-2.5 text-center text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
    />
  );
}

function WonInput({
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
      <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          min={0}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <span className="shrink-0 text-sm text-gray-600">만원</span>
      </div>
    </div>
  );
}
