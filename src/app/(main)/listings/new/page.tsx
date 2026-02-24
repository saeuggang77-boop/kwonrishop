"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  MapPin, Search, ChevronLeft, Check,
  Camera, FileText, Link2, Info, AlertTriangle, X,
  Store, ClipboardList, Coins, PenLine,
} from "lucide-react";
import {
  BUSINESS_SUBCATEGORIES,
  STORE_FEATURES,
  REGIONS,
} from "@/lib/utils/constants";
import { ImageUploader } from "@/components/listings/image-uploader";
import { useToast } from "@/components/ui/toast";
import { calculateSafetyGrade } from "@/lib/utils/safety-grade";
import { Map, MapMarker, useKakaoLoader } from "react-kakao-maps-sdk";

/* ─── Constants ─── */

const TOTAL_STEPS = 7;

const STEP_TITLES = [
  "위치정보를 입력해주세요.",
  "매물정보를 입력해주세요.",
  "기본정보를 입력해주세요.",
  "추가정보를 입력해주세요.",
  "매물설명을 입력해주세요.",
  "매출증빙자료와 매물사진을 올려주세요.",
  "매출 매입자료를 연동해주세요.",
];

const CATEGORY_GROUPS = [
  { key: "외식업", emoji: "🍳" },
  { key: "서비스업", emoji: "✅" },
  { key: "도/소매업", emoji: "🛍️" },
  { key: "예술/스포츠/시설업", emoji: "🎳" },
  { key: "교육/학원업", emoji: "📚" },
  { key: "숙박업", emoji: "🏨" },
  { key: "기타", emoji: "💬" },
] as const;
const REGION_KEYS = Object.keys(REGIONS);

const FLOOR_CHOICES = ["지하", "1층", "2층", "3층", "4층", "5층 이상"] as const;

const STEP_ICON_COMPONENTS = [MapPin, Store, ClipboardList, Coins, PenLine, Camera, Link2];

/* ─── External Library Types ─── */

interface DaumPostcodeResult {
  address: string;
  roadAddress: string;
  jibunAddress: string;
  zonecode: string;
  sido: string;
  sigungu: string;
  bname: string;
}

interface DaumPostcodeInstance {
  open(): void;
  embed(element: HTMLElement): void;
}

interface DaumPostcodeConstructor {
  new (options: { oncomplete: (data: DaumPostcodeResult) => void }): DaumPostcodeInstance;
}

interface DaumNamespace {
  Postcode: DaumPostcodeConstructor;
}

declare global {
  interface Window {
    daum?: DaumNamespace;
    kakao?: any;
  }
}

/* ─── Types ─── */

interface FormData {
  // Step 1
  address: string;
  addressDetail: string;
  city: string;
  district: string;
  neighborhood: string;
  fairTradeAgreed: boolean;
  latitude: number | null;
  longitude: number | null;
  // Step 2
  categoryGroup: string;
  businessCategory: string;
  businessSubtype: string;
  deposit: string;
  monthlyRent: string;
  premiumFee: string;
  noPremium: boolean;
  premiumNegotiable: boolean;
  goodwillPremium: string;
  goodwillPremiumDesc: string;
  goodwillPremiumEnabled: boolean;
  facilityPremium: string;
  facilityPremiumDesc: string;
  facilityPremiumEnabled: boolean;
  floorPremium: string;
  floorPremiumDesc: string;
  floorPremiumEnabled: boolean;
  managementFee: string;
  // Step 3
  isFranchise: boolean;
  storeName: string;
  franchiseName: string;
  storeType: string;
  floor: string;
  areaPyeong: string;
  features: string[];
  parkingAvailable: boolean;
  parkingCount: string;
  // Step 4
  monthlyRevenue: string;
  materialCost: string;
  laborCost: string;
  soloOperation: boolean;
  familyStaff: string;
  fullTimeStaff: string;
  partTimeStaff: string;
  expenseRent: string;
  expenseMaintenance: string;
  utilities: string;
  otherExpense: string;
  operatingYears: string;
  profitDescription: string;
  // Step 5
  title: string;
  description: string;
  transferReason: string;
  // Step 6
  contactVisible: boolean;
  contactPhone: string;
  contactEmail: string;
  isPhonePublic: boolean;
  // Step 7
  hometaxLinked: boolean;
  creditCardLinked: boolean;
  baeminLinked: boolean;
  yogiyoLinked: boolean;
  coupangLinked: boolean;
}

const initialForm: FormData = {
  address: "", addressDetail: "", city: "", district: "", neighborhood: "", fairTradeAgreed: false, latitude: null, longitude: null,
  categoryGroup: "", businessCategory: "", businessSubtype: "", deposit: "", monthlyRent: "",
  premiumFee: "", noPremium: false, premiumNegotiable: false,
  goodwillPremium: "", goodwillPremiumDesc: "", goodwillPremiumEnabled: false,
  facilityPremium: "", facilityPremiumDesc: "", facilityPremiumEnabled: false,
  floorPremium: "", floorPremiumDesc: "", floorPremiumEnabled: false,
  managementFee: "",
  isFranchise: false, storeName: "", franchiseName: "", storeType: "GENERAL_STORE",
  floor: "", areaPyeong: "", features: [], parkingAvailable: false, parkingCount: "",
  monthlyRevenue: "", materialCost: "", laborCost: "", soloOperation: false,
  familyStaff: "", fullTimeStaff: "", partTimeStaff: "",
  expenseRent: "", expenseMaintenance: "", utilities: "", otherExpense: "",
  operatingYears: "", profitDescription: "",
  title: "", description: "", transferReason: "",
  contactVisible: false, contactPhone: "", contactEmail: "", isPhonePublic: false,
  hometaxLinked: false, creditCardLinked: false, baeminLinked: false, yogiyoLinked: false, coupangLinked: false,
};

/* ─── Helpers ─── */

function formatManwon(value: string): string {
  const num = Number(value);
  if (!num) return "";
  if (num >= 10000) return `${(num / 10000).toFixed(num % 10000 === 0 ? 0 : 1)}억원`;
  return `${num.toLocaleString()}만원`;
}

function addCommas(v: string): string {
  const n = v.replace(/[^0-9]/g, "");
  if (!n) return "";
  return Number(n).toLocaleString();
}

function stripCommas(v: string): string {
  return v.replace(/[^0-9]/g, "");
}

function pyeongToM2(py: string): string {
  const n = Number(py);
  if (!n) return "";
  return (n * 3.306).toFixed(1);
}

/* ─── Main Component ─── */

export default function NewListingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadedImages, setUploadedImages] = useState<{ key: string; url: string; category?: string }[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<{ name: string; key: string; url: string; previewUrl?: string; size?: number; mimeType?: string }[]>([]);
  const [showFairTradeModal, setShowFairTradeModal] = useState(false);
  const [categoryShake, setCategoryShake] = useState(false);
  const { toast } = useToast();

  const districtOptions = form.city ? REGIONS[form.city] ?? [] : [];

  const update = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Auto-calculated values
  const investmentTotal = useMemo(() => {
    const d = Number(form.deposit) || 0;
    const p = form.noPremium ? 0 : Number(form.premiumFee) || 0;
    return d + p;
  }, [form.deposit, form.premiumFee, form.noPremium]);

  const totalExpenses = useMemo(() => {
    return (
      (Number(form.materialCost) || 0) +
      (Number(form.laborCost) || 0) +
      (Number(form.expenseRent) || 0) +
      (Number(form.expenseMaintenance) || 0) +
      (Number(form.utilities) || 0) +
      (Number(form.otherExpense) || 0)
    );
  }, [form.materialCost, form.laborCost, form.expenseRent, form.expenseMaintenance, form.utilities, form.otherExpense]);

  const netProfit = useMemo(() => {
    const rev = Number(form.monthlyRevenue) || 0;
    return rev - totalExpenses;
  }, [form.monthlyRevenue, totalExpenses]);

  const expensePercent = useMemo(() => {
    const rev = Number(form.monthlyRevenue) || 0;
    if (rev === 0) return 0;
    return Math.round((totalExpenses / rev) * 100);
  }, [form.monthlyRevenue, totalExpenses]);

  const premiumBreakdownTotal = useMemo(() => {
    if (form.noPremium) return 0;
    return (
      (Number(form.goodwillPremium) || 0) +
      (Number(form.facilityPremium) || 0) +
      (Number(form.floorPremium) || 0)
    );
  }, [form.goodwillPremium, form.facilityPremium, form.floorPremium, form.noPremium]);

  const goNext = () => {
    if (step >= TOTAL_STEPS) return;
    // Step validation
    switch (step) {
      case 1: // Location
        if (!form.city || !form.district || (!form.address && !form.neighborhood)) {
          toast("info", "주소를 입력해주세요.");
          return;
        }
        if (!form.address) {
          setForm((f) => ({ ...f, address: `${f.city} ${f.district} ${f.neighborhood}` }));
        }
        break;
      case 2: // Category
        if (!form.categoryGroup) {
          toast("info", "업종 대분류를 선택해주세요.");
          setCategoryShake(true);
          setTimeout(() => setCategoryShake(false), 600);
          return;
        }
        if (!form.businessCategory) {
          toast("info", "세부 업종을 선택해주세요.");
          return;
        }
        break;
      case 3: // Price
        if (!form.deposit) {
          toast("info", "보증금을 입력해주세요.");
          return;
        }
        break;
      case 4: // Additional
        if (!form.monthlyRevenue) {
          toast("info", "월 매출을 입력해주세요.");
          return;
        }
        break;
      case 5: // Description
        if (!form.title || !form.description) {
          toast("info", "제목과 설명을 입력해주세요.");
          return;
        }
        break;
      case 6: { // Photos
        const hasExterior = uploadedImages.some((img) => img.category === "exterior");
        const hasInterior = uploadedImages.some((img) => img.category === "interior");
        if (!hasExterior || !hasInterior) {
          toast("info", "외부 전경과 내부 전경 사진은 필수입니다.");
          return;
        }
        break;
      }
    }
    setStep(step + 1);
  };
  const goPrev = () => { if (step > 1) setStep(step - 1); };

  const handleSubmit = async () => {
    setErrorMsg("");
    setIsLoading(true);

    try {
      const toWon = (manwon: string) => manwon ? Number(manwon) * 10000 : undefined;

      const body: Record<string, unknown> = {
        title: form.title,
        description: form.description,
        transferReason: form.transferReason || undefined,
        businessCategory: form.businessCategory,
        storeType: form.isFranchise ? "FRANCHISE" : form.storeType,
        price: toWon(form.deposit) ?? 0,
        address: form.address || `${form.city} ${form.district} ${form.neighborhood}`.trim(),
        city: form.city,
        district: form.district,
      };

      if (form.monthlyRent) body.monthlyRent = toWon(form.monthlyRent);
      if (!form.noPremium && form.premiumFee) {
        body.premiumFee = toWon(form.premiumFee);
        if (form.goodwillPremium) body.goodwillPremium = Number(form.goodwillPremium);
        if (form.goodwillPremiumDesc) body.goodwillPremiumDesc = form.goodwillPremiumDesc;
        if (form.facilityPremium) body.facilityPremium = Number(form.facilityPremium);
        if (form.facilityPremiumDesc) body.facilityPremiumDesc = form.facilityPremiumDesc;
        if (form.floorPremium) body.floorPremium = Number(form.floorPremium);
        if (form.floorPremiumDesc) body.floorPremiumDesc = form.floorPremiumDesc;
      }
      if (form.managementFee) body.managementFee = toWon(form.managementFee);
      if (form.monthlyRevenue) body.monthlyRevenue = toWon(form.monthlyRevenue);
      if (netProfit) body.monthlyProfit = netProfit * 10000;
      if (form.businessSubtype) body.businessSubtype = form.businessSubtype;
      if (form.addressDetail) body.addressDetail = form.addressDetail;
      if (form.neighborhood) body.neighborhood = form.neighborhood;
      if (form.latitude != null && form.longitude != null) {
        body.latitude = form.latitude;
        body.longitude = form.longitude;
      }
      if (form.areaPyeong) body.areaM2 = Number((Number(form.areaPyeong) * 3.306).toFixed(1));
      if (form.floor) body.floor = FLOOR_CHOICES.indexOf(form.floor as typeof FLOOR_CHOICES[number]);
      if (form.operatingYears) body.operatingYears = Number(form.operatingYears);
      if (form.contactPhone) body.contactPhone = form.contactPhone;
      if (form.contactEmail) body.contactEmail = form.contactEmail;
      if (form.isPhonePublic !== undefined) body.isPhonePublic = form.isPhonePublic;
      if (form.storeName) body.storeName = form.storeName;
      if (form.franchiseName) body.franchiseName = form.franchiseName;
      if (form.features.length > 0) body.features = form.features;
      const totalStaff = form.soloOperation ? 1 : 1 + (Number(form.familyStaff) || 0) + (Number(form.fullTimeStaff) || 0) + (Number(form.partTimeStaff) || 0);
      body.staffCount = totalStaff;
      if (uploadedImages.length > 0) body.images = uploadedImages;
      if (uploadedDocs.length > 0) body.documents = uploadedDocs;

      // Auto-calculate safety grade
      const gradeResult = calculateSafetyGrade({
        hasHometaxIntegration: form.hometaxLinked,
        hasCrefiaIntegration: form.creditCardLinked,
        hasRevenueDocuments: uploadedDocs.length > 0,
      });
      body.safetyGrade = gradeResult.grade;
      body.safetyComment = gradeResult.comment;

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error?.message ?? "매물 등록에 실패했습니다.");
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      router.push(`/listings/${data.data.id}`);
    } catch {
      setErrorMsg("서버 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-navy" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-gray-500">매물 등록은 로그인 후 이용 가능합니다.</p>
        <Link href="/login" className="mt-4 inline-block rounded-lg bg-navy px-6 py-3 text-sm font-medium text-white hover:bg-navy-dark">
          로그인하기
        </Link>
      </div>
    );
  }

  const StepIcon = STEP_ICON_COMPONENTS[step - 1];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Progress Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => step === 1 ? router.back() : goPrev()}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="h-4 w-4" />
            {step === 1 ? "돌아가기" : "이전"}
          </button>
          <span className="text-sm font-bold text-navy sm:hidden">{step}/{TOTAL_STEPS}</span>
        </div>

        {/* Step Indicators - Desktop */}
        <div className="mt-4 hidden items-center sm:flex">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => {
            const s = i + 1;
            const completed = s < step;
            const current = s === step;
            return (
              <div key={s} className={`flex items-center ${s < TOTAL_STEPS ? "flex-1" : ""}`}>
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    completed
                      ? "bg-navy text-white"
                      : current
                        ? "bg-navy text-white ring-4 ring-navy/20"
                        : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {completed ? <Check className="h-4 w-4" /> : s}
                </div>
                {s < TOTAL_STEPS && (
                  <div className={`mx-1.5 h-0.5 flex-1 transition-colors ${s < step ? "bg-navy" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Bar - Mobile */}
        <div className="mt-3 h-1.5 w-full rounded-full bg-gray-200 sm:hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-navy to-navy-400 transition-all duration-500"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Icon + Title */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy/10">
          <StepIcon className="h-6 w-6 text-navy" />
        </div>
        <h1 className="text-xl font-bold text-navy">
          {STEP_TITLES[step - 1]}
        </h1>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Step Content */}
      <div className="animate-fade-in">
        {step === 1 && <Step1Location form={form} update={update} districtOptions={districtOptions} showFairTradeModal={showFairTradeModal} setShowFairTradeModal={setShowFairTradeModal} />}
        {step === 2 && <Step2Business form={form} update={update} premiumBreakdownTotal={premiumBreakdownTotal} categoryShake={categoryShake} />}
        {step === 3 && <Step3Basic form={form} update={update} />}
        {step === 4 && <Step4Additional form={form} update={update} investmentTotal={investmentTotal} totalExpenses={totalExpenses} netProfit={netProfit} expensePercent={expensePercent} />}
        {step === 5 && <Step5Description form={form} update={update} />}
        {step === 6 && <Step6Photos form={form} update={update} setUploadedImages={setUploadedImages} uploadedDocs={uploadedDocs} setUploadedDocs={setUploadedDocs} />}
        {step === 7 && <Step7Integration />}
      </div>

      {/* 권리진단 프로모션 배너 */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 mt-4">
        <p className="text-sm font-semibold text-emerald-800">매물 등록 후 권리진단서를 발급받으면 배지가 자동 부여됩니다</p>
        <p className="text-xs text-emerald-600 mt-1">
          &ldquo;권리진단 완료&rdquo; 배지가 부여된 매물은 문의율이 평균 2배 높습니다.
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={goPrev}
            className="flex-1 rounded-xl border border-gray-300 bg-white py-3.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 active:scale-[0.98]"
          >
            이전
          </button>
        )}
        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={goNext}
            className="flex-[2] rounded-xl bg-gradient-to-r from-navy to-navy-400 py-3.5 text-base font-bold text-white shadow-lg shadow-navy/25 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-navy/30 active:scale-[0.98]"
          >
            다음
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-[2] rounded-xl bg-[#F59E0B] py-3.5 text-base font-bold text-white shadow-lg shadow-[#F59E0B]/25 transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#D97706] hover:shadow-xl hover:shadow-[#F59E0B]/30 active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? "등록 중..." : "매물 등록 완료"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STEP 1: 위치정보
   ═══════════════════════════════════════════════════ */

function loadDaumPostcodeScript(): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector<HTMLScriptElement>('script[src*="postcode"]')) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

function Step1Location({
  form, update, districtOptions, showFairTradeModal, setShowFairTradeModal,
}: {
  form: FormData;
  update: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  districtOptions: string[];
  showFairTradeModal: boolean;
  setShowFairTradeModal: (v: boolean) => void;
}) {
  const KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  const [sdkLoading] = useKakaoLoader({ appkey: KEY ?? "", libraries: ["services"] });

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    form.latitude != null && form.longitude != null ? { lat: form.latitude, lng: form.longitude } : null
  );
  const [showPostcode, setShowPostcode] = useState(false);
  const postcodeRef = useRef<HTMLDivElement>(null);

  const handleAddressSearch = async () => {
    setShowPostcode(true);
    await loadDaumPostcodeScript();
    // Wait for the ref container to render
    requestAnimationFrame(() => {
      if (!window.daum || !postcodeRef.current) return;
      new window.daum.Postcode({
        oncomplete: (data: DaumPostcodeResult) => {
          setShowPostcode(false);
          update("address", data.roadAddress || data.jibunAddress || data.address);
          update("city", data.sido);
          update("district", data.sigungu);
          update("neighborhood", data.bname);

          // Geocode using roadAddress for accurate coordinates
          const geocodeAddr = data.roadAddress || data.jibunAddress || data.address;
          if (!sdkLoading && window.kakao?.maps?.services) {
            const geocoder = new window.kakao.maps.services.Geocoder();
            geocoder.addressSearch(geocodeAddr, (result: any[], status: any) => {
              if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
                const lat = parseFloat(result[0].y);
                const lng = parseFloat(result[0].x);
                setCoords({ lat, lng });
                update("latitude", lat);
                update("longitude", lng);
              }
            });
          }
        },
      }).embed(postcodeRef.current);
    });
  };

  return (
    <div className="space-y-5">
      {/* Address Search */}
      <div>
        <SectionLabel>주소 검색</SectionLabel>
        <button
          type="button"
          onClick={handleAddressSearch}
          className="flex w-full items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-left text-sm text-gray-400 transition-colors hover:border-navy hover:bg-navy/5"
        >
          <Search className="h-5 w-5 text-navy" />
          {form.address || "도로명, 건물명, 지번으로 검색"}
        </button>
      </div>

      {/* Daum Postcode Embed / Map / Placeholder */}
      {showPostcode ? (
        <div
          ref={postcodeRef}
          className="h-96 overflow-hidden rounded-xl border border-gray-200"
        />
      ) : coords ? (
        <div className="h-52 overflow-hidden rounded-xl border border-gray-200">
          <Map center={coords} style={{ width: "100%", height: "100%" }} level={3}>
            <MapMarker position={coords} />
          </Map>
        </div>
      ) : (
        <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50">
          <div className="text-center text-gray-400">
            <MapPin className="mx-auto mb-2 h-8 w-8" />
            <p className="text-sm">주소를 검색하면 지도가 표시됩니다</p>
          </div>
        </div>
      )}

      {/* Region (auto-filled from address search, read-only) */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <SectionLabel>시/도</SectionLabel>
          <input
            value={form.city}
            readOnly
            placeholder="주소 검색 시 자동입력"
            className="step-input bg-gray-100 text-gray-600 cursor-not-allowed"
          />
        </div>
        <div>
          <SectionLabel>시/군/구</SectionLabel>
          <input
            value={form.district}
            readOnly
            placeholder="주소 검색 시 자동입력"
            className="step-input bg-gray-100 text-gray-600 cursor-not-allowed"
          />
        </div>
        <div>
          <SectionLabel>동/읍/면</SectionLabel>
          <input
            value={form.neighborhood}
            readOnly
            placeholder="주소 검색 시 자동입력"
            className="step-input bg-gray-100 text-gray-600 cursor-not-allowed"
          />
        </div>
      </div>

      <div>
        <SectionLabel>상세주소</SectionLabel>
        <input
          value={form.addressDetail}
          onChange={(e) => update("addressDetail", e.target.value)}
          placeholder="상세주소를 입력하세요 (예: 2층 201호)"
          className="step-input"
        />
      </div>

      {/* Fair Trade Agreement */}
      <div className="rounded-xl border border-navy/20 bg-navy/5 p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={form.fairTradeAgreed}
            onChange={(e) => update("fairTradeAgreed", e.target.checked)}
            className="mt-0.5 h-5 w-5 rounded border-gray-300 accent-navy"
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-800">공정거래 이용약관에 동의합니다.</span>
            <button
              type="button"
              onClick={() => setShowFairTradeModal(true)}
              className="ml-1 text-sm text-navy hover:underline"
            >
              내용보기
            </button>
          </div>
        </label>
      </div>

      {/* Fair Trade Modal */}
      {showFairTradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowFairTradeModal(false)}>
          <div className="max-h-[70vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-navy">공정거래 이용약관</h3>
              <button type="button" onClick={() => setShowFairTradeModal(false)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-gray-600">
              <p>1. 매물 정보는 사실에 기반하여 정확하게 작성해야 합니다.</p>
              <p>2. 허위 매물 등록, 가격 조작 등 부정행위를 금지합니다.</p>
              <p>3. 등록된 매물 정보는 플랫폼 내에서 공개되며, 이에 동의합니다.</p>
              <p>4. 거래 관련 분쟁 시 플랫폼의 중재 절차에 협조합니다.</p>
              <p>5. 관련 법령을 준수하며, 위반 시 법적 책임을 집니다.</p>
            </div>
            <button
              type="button"
              onClick={() => { update("fairTradeAgreed", true); setShowFairTradeModal(false); }}
              className="mt-6 w-full rounded-xl bg-navy py-3 text-sm font-bold text-white"
            >
              동의하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STEP 2: 매물정보
   ═══════════════════════════════════════════════════ */

function Step2Business({
  form, update, premiumBreakdownTotal, categoryShake,
}: {
  form: FormData;
  update: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  premiumBreakdownTotal: number;
  categoryShake: boolean;
}) {
  const subcategories = form.categoryGroup ? BUSINESS_SUBCATEGORIES[form.categoryGroup] ?? [] : [];

  return (
    <div className="space-y-6">
      {/* Category Group Cards */}
      <div>
        <p className="mb-1 text-sm font-medium text-gray-700">
          업종 대분류 <span className="text-red-500">*</span>
        </p>
        <div
          className={`mt-2 grid grid-cols-3 gap-2.5 sm:grid-cols-4 ${
            categoryShake ? "animate-[shake_0.5s_ease-in-out]" : ""
          }`}
          style={categoryShake ? { animation: "shake 0.5s ease-in-out" } : undefined}
        >
          {CATEGORY_GROUPS.map((group) => {
            const isActive = form.categoryGroup === group.key;
            return (
              <button
                key={group.key}
                type="button"
                onClick={() => {
                  update("categoryGroup", group.key);
                  update("businessCategory", "");
                  update("businessSubtype", "");
                }}
                className={`relative flex min-h-[80px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center transition-all ${
                  isActive
                    ? "border-navy bg-navy text-white shadow-md"
                    : `bg-white text-gray-600 hover:border-navy hover:bg-navy-50 ${
                        categoryShake ? "border-red-400" : "border-gray-300"
                      }`
                }`}
              >
                {isActive && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/30">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                )}
                <span className="text-[32px] leading-none">{group.emoji}</span>
                <span className="text-xs font-semibold">{group.key}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subcategory Cards */}
      {subcategories.length > 0 && (
        <div>
          <p className="mb-1 text-sm font-medium text-gray-700">
            세부 업종 <span className="text-red-500">*</span>
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {subcategories.map((sub) => {
              const isActive = form.businessCategory === sub.key && (sub.subtype ? form.businessSubtype === sub.subtype : true);
              return (
                <button
                  key={sub.label}
                  type="button"
                  onClick={() => {
                    update("businessCategory", sub.key);
                    update("businessSubtype", sub.subtype ?? "");
                  }}
                  className={`relative flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-xl border-2 px-2 py-2.5 text-center transition-all ${
                    isActive
                      ? "border-navy bg-navy text-white shadow-md"
                      : "border-gray-300 bg-white text-gray-600 hover:border-navy hover:bg-navy-50"
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white/30">
                      <Check className="h-3 w-3 text-white" />
                    </span>
                  )}
                  <span className="text-xl leading-none">{sub.emoji}</span>
                  <span className="text-[11px] font-semibold leading-tight">{sub.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Deposit (보증금) */}
      <InlineLabelInput label="보증금" value={form.deposit} onChange={(v) => update("deposit", v)} />

      {/* Monthly Rent (월세) */}
      <InlineLabelInput label="월세" value={form.monthlyRent} onChange={(v) => update("monthlyRent", v)} />

      {/* Premium Fee (권리금) */}
      <div>
        {!form.noPremium ? (
          <>
            <div className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-sm font-bold text-navy">권리금</span>
              <input
                type="text"
                inputMode="numeric"
                value={addCommas(form.premiumFee)}
                onChange={(e) => update("premiumFee", stripCommas(e.target.value))}
                placeholder="숫자만 입력"
                className="step-input flex-1 text-right"
              />
              <span className="shrink-0 text-sm font-medium text-gray-500">만원</span>
              <label className="flex shrink-0 items-center gap-1 text-xs text-gray-500">
                <input type="checkbox" checked={form.noPremium} onChange={(e) => update("noPremium", e.target.checked)} className="h-4 w-4 rounded accent-navy" />
                무권리금
              </label>
              <label className="flex shrink-0 items-center gap-1 text-xs text-gray-500">
                <input type="checkbox" checked={form.premiumNegotiable} onChange={(e) => update("premiumNegotiable", e.target.checked)} className="h-4 w-4 rounded accent-navy" />
                협의가능
              </label>
            </div>

            {/* Premium Breakdown — always expanded */}
            <div className="mt-4 space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-700">권리금 세부내역</p>

              <PremiumBreakdownOpen
                label="영업권리금"
                value={form.goodwillPremium}
                onValueChange={(v) => update("goodwillPremium", v)}
                desc={form.goodwillPremiumDesc}
                onDescChange={(v) => update("goodwillPremiumDesc", v)}
                placeholder={"월 평균 매출, 매출 추이, 단골 비율 등을 구체적으로 작성해주세요\n예) 2024년 오픈 후 월평균 매출 3,000만원 유지, 배달앱 별점 4.8, 단골비율 40%"}
              />

              <PremiumBreakdownOpen
                label="시설권리금"
                value={form.facilityPremium}
                onValueChange={(v) => update("facilityPremium", v)}
                desc={form.facilityPremiumDesc}
                onDescChange={(v) => update("facilityPremiumDesc", v)}
                placeholder={"주방설비, 인테리어, 가구, 냉난방 등 시설 목록과 상태를 작성해주세요\n예) 업소용 냉장고 2대, 에어컨 4대, 2023년 인테리어 전체 신규 시공 3,000만원"}
              />

              <FloorPremiumAuto
                totalPremium={Number(form.premiumFee) || 0}
                goodwill={Number(form.goodwillPremium) || 0}
                facility={Number(form.facilityPremium) || 0}
                onValueChange={(v) => update("floorPremium", v)}
                desc={form.floorPremiumDesc}
                onDescChange={(v) => update("floorPremiumDesc", v)}
              />

              {premiumBreakdownTotal > 0 && (
                <div className="border-t border-gray-200 pt-3 text-right text-sm font-bold text-navy">
                  소계: {formatManwon(String(premiumBreakdownTotal))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <span className="text-sm font-bold text-navy">권리금</span>
            <span className="text-sm text-gray-400">무권리금</span>
            <div className="ml-auto flex items-center gap-3">
              <label className="flex items-center gap-1 text-xs text-gray-500">
                <input type="checkbox" checked={form.noPremium} onChange={(e) => update("noPremium", e.target.checked)} className="h-4 w-4 rounded accent-navy" />
                무권리금
              </label>
              <label className="flex items-center gap-1 text-xs text-gray-500">
                <input type="checkbox" checked={form.premiumNegotiable} onChange={(e) => update("premiumNegotiable", e.target.checked)} className="h-4 w-4 rounded accent-navy" />
                협의가능
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Management Fee (관리비) */}
      <InlineLabelInput label="관리비" value={form.managementFee} onChange={(v) => update("managementFee", v)} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STEP 3: 기본정보
   ═══════════════════════════════════════════════════ */

function Step3Basic({
  form, update,
}: {
  form: FormData;
  update: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Franchise / Individual */}
      <div>
        <SectionLabel>업소 형태</SectionLabel>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <RadioCard
            active={!form.isFranchise}
            onClick={() => update("isFranchise", false)}
            label="개인매장"
            desc="개인이 운영하는 매장"
          />
          <RadioCard
            active={form.isFranchise}
            onClick={() => update("isFranchise", true)}
            label="프랜차이즈"
            desc="프랜차이즈 가맹점"
          />
        </div>
      </div>

      {/* Store / Franchise Name */}
      <div>
        <SectionLabel>매장명</SectionLabel>
        <input
          value={form.storeName}
          onChange={(e) => update("storeName", e.target.value)}
          placeholder="매장 이름을 입력해주세요"
          className="step-input"
        />
      </div>
      {form.isFranchise && (
        <div>
          <SectionLabel>프랜차이즈명</SectionLabel>
          <input
            value={form.franchiseName}
            onChange={(e) => update("franchiseName", e.target.value)}
            placeholder="예: BBQ, 이디야커피"
            className="step-input"
          />
        </div>
      )}

      {/* Floor */}
      <div>
        <SectionLabel>층수</SectionLabel>
        <div className="mt-2 flex flex-wrap gap-2">
          {FLOOR_CHOICES.map((f) => (
            <ChipButton
              key={f}
              active={form.floor === f}
              onClick={() => update("floor", f)}
            >
              {f}
            </ChipButton>
          ))}
        </div>
      </div>

      {/* Area */}
      <div>
        <SectionLabel>면적</SectionLabel>
        <div className="mt-1 grid grid-cols-2 gap-3">
          <div className="relative">
            <input
              type="number"
              step="0.1"
              value={form.areaPyeong}
              onChange={(e) => update("areaPyeong", e.target.value)}
              placeholder="20"
              className="step-input pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">평</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
            <span className="text-gray-400">≈</span>
            <span className="font-medium text-navy">{pyeongToM2(form.areaPyeong) || "—"}</span>
            <span>m²</span>
          </div>
        </div>
      </div>

      {/* Features/Themes */}
      <div>
        <SectionLabel>매물 특성 (복수 선택)</SectionLabel>
        <div className="mt-2 flex flex-wrap gap-2">
          {STORE_FEATURES.map((feat) => {
            const isActive = form.features.includes(feat);
            return (
              <ChipButton
                key={feat}
                active={isActive}
                onClick={() => {
                  update(
                    "features",
                    isActive ? form.features.filter((f) => f !== feat) : [...form.features, feat]
                  );
                }}
              >
                {isActive && <Check className="h-3 w-3" />}
                {feat}
              </ChipButton>
            );
          })}
        </div>
      </div>

      {/* Parking */}
      <div>
        <SectionLabel>주차</SectionLabel>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <RadioCard
            active={!form.parkingAvailable}
            onClick={() => update("parkingAvailable", false)}
            label="주차 불가"
          />
          <RadioCard
            active={form.parkingAvailable}
            onClick={() => update("parkingAvailable", true)}
            label="주차 가능"
          />
        </div>
        {form.parkingAvailable && (
          <div className="mt-3">
            <input
              type="number"
              value={form.parkingCount}
              onChange={(e) => update("parkingCount", e.target.value)}
              placeholder="주차 가능 대수"
              className="step-input"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STEP 4: 추가정보
   ═══════════════════════════════════════════════════ */

function Step4Additional({
  form, update, investmentTotal, totalExpenses, netProfit, expensePercent,
}: {
  form: FormData;
  update: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  investmentTotal: number;
  totalExpenses: number;
  netProfit: number;
  expensePercent: number;
}) {
  // Auto-fill rent/maintenance from step 2 values on first mount
  const didAutoFill = useRef(false);
  useEffect(() => {
    if (didAutoFill.current) return;
    didAutoFill.current = true;
    if (!form.expenseRent && form.monthlyRent) {
      update("expenseRent", form.monthlyRent);
    }
    if (!form.expenseMaintenance && form.managementFee) {
      update("expenseMaintenance", form.managementFee);
    }
  }, [form.expenseRent, form.expenseMaintenance, form.monthlyRent, form.managementFee, update]);

  const rev = Number(form.monthlyRevenue) || 0;
  const pct = (val: string) => {
    if (rev === 0) return null;
    const n = Number(val) || 0;
    if (n === 0) return null;
    return Math.round((n / rev) * 100);
  };

  return (
    <div className="space-y-5">
      {/* Investment Total (auto) */}
      <div>
        <SectionLabel>총 투자비용 (자동 계산)</SectionLabel>
        <div className="rounded-xl border border-navy/20 bg-navy/5 px-4 py-3.5">
          <span className="text-lg font-bold text-navy">
            {investmentTotal > 0 ? formatManwon(String(investmentTotal)) : "—"}
          </span>
          <p className="mt-0.5 text-xs text-gray-500">보증금 + 권리금</p>
        </div>
      </div>

      {/* Monthly Revenue */}
      <div>
        <SectionLabel>월 매출</SectionLabel>
        <ManwonInput
          value={form.monthlyRevenue}
          onChange={(v) => update("monthlyRevenue", v)}
          placeholder="2500"
        />
      </div>

      {/* Monthly Expenses Breakdown */}
      <div>
        <SectionLabel>월 지출 세부항목</SectionLabel>
        <div className="mt-2 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
          {/* 재료비 */}
          <ExpenseRow
            label="재료비"
            value={form.materialCost}
            onChange={(v) => update("materialCost", v)}
            pct={pct(form.materialCost)}
          />

          {/* 인건비 */}
          <div>
            <ExpenseRow
              label="인건비"
              value={form.laborCost}
              onChange={(v) => update("laborCost", v)}
              pct={pct(form.laborCost)}
            />
            <div className="ml-2 mt-2 space-y-2 rounded-lg border border-gray-200 bg-white p-3">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={form.soloOperation}
                  onChange={(e) => update("soloOperation", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 accent-navy"
                />
                혼자 운영 중
              </label>
              {!form.soloOperation && (
                <div className="grid grid-cols-3 gap-2">
                  <StaffInput label="가족/동업자" value={form.familyStaff} onChange={(v) => update("familyStaff", v)} />
                  <StaffInput label="정직원" value={form.fullTimeStaff} onChange={(v) => update("fullTimeStaff", v)} />
                  <StaffInput label="파트타임" value={form.partTimeStaff} onChange={(v) => update("partTimeStaff", v)} />
                </div>
              )}
            </div>
          </div>

          {/* 월세 */}
          <ExpenseRow
            label="월세"
            value={form.expenseRent}
            onChange={(v) => update("expenseRent", v)}
            pct={pct(form.expenseRent)}
          />

          {/* 관리비 */}
          <ExpenseRow
            label="관리비"
            value={form.expenseMaintenance}
            onChange={(v) => update("expenseMaintenance", v)}
            pct={pct(form.expenseMaintenance)}
          />

          {/* 공과금 */}
          <div>
            <ExpenseRow
              label="공과금"
              value={form.utilities}
              onChange={(v) => update("utilities", v)}
              pct={pct(form.utilities)}
            />
            <p className="ml-[4.5rem] mt-1 text-xs text-red-400">* 전기, 수도, 가스요금 등을 합산</p>
          </div>

          {/* 기타경비 */}
          <div>
            <ExpenseRow
              label="기타경비"
              value={form.otherExpense}
              onChange={(v) => update("otherExpense", v)}
              pct={pct(form.otherExpense)}
            />
            <p className="ml-[4.5rem] mt-1 text-xs text-red-400">* 배달대행비, 광고비, 수수료, 회계기장료, 보안/인터넷, 화재보험, 정수기 등 합산</p>
          </div>

          {/* Total */}
          <div className="border-t border-gray-300 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-navy">월 지출 합계</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-navy">
                  {totalExpenses > 0 ? formatManwon(String(totalExpenses)) : "—"}
                </span>
                {expensePercent > 0 && (
                  <span className="text-xs text-gray-400">매출 대비 {expensePercent}%</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Net Profit (auto) */}
      <div>
        <SectionLabel>월순이익 (자동 계산)</SectionLabel>
        <div className={`rounded-xl border px-4 py-3.5 ${netProfit >= 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
          <span className={`text-lg font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
            {netProfit !== 0 ? formatManwon(String(Math.abs(netProfit))) : "—"}
            {netProfit < 0 && netProfit !== 0 && " (적자)"}
          </span>
          <p className="mt-0.5 text-xs text-gray-500">월 매출 - 월 지출 합계</p>
        </div>
      </div>

      {/* Profit Description */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm font-medium text-gray-700">순이익에 대한 추가정보를 입력해주세요</p>
        <p className="mt-1 text-xs text-gray-500">
          평균 순이익이 정말 맞으신가요? 매수자들께서 잘 이해할 수 있도록 부연설명을 해주세요.
        </p>
        <textarea
          value={form.profitDescription}
          onChange={(e) => update("profitDescription", e.target.value)}
          placeholder="예: 여름 성수기 매출이 높고, 겨울에는 다소 낮습니다. 평균적으로..."
          rows={4}
          maxLength={500}
          className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-navy focus:ring-1 focus:ring-navy/20 placeholder:text-gray-400 resize-y"
        />
        <p className="mt-1 text-right text-xs text-gray-400">{form.profitDescription.length}/500</p>
      </div>

      {/* Operating Years */}
      <div>
        <SectionLabel>영업 기간</SectionLabel>
        <div className="relative">
          <input
            type="number"
            value={form.operatingYears}
            onChange={(e) => update("operatingYears", e.target.value)}
            placeholder="3"
            className="step-input pr-12"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">년</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STEP 5: 매물설명
   ═══════════════════════════════════════════════════ */

function Step5Description({
  form, update,
}: {
  form: FormData;
  update: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <SectionLabel>매물 제목</SectionLabel>
        <input
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="예: 강남역 치킨집 양도합니다"
          className="step-input"
          maxLength={60}
        />
        <p className="mt-1 text-right text-xs text-gray-400">{form.title.length}/60</p>
      </div>

      {/* Description */}
      <div>
        <SectionLabel>상세 설명</SectionLabel>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="매물에 대한 상세 설명을 입력해주세요.&#10;&#10;예: 매장 위치, 매출 특성, 주요 고객층, 양도 사유 등을 상세히 작성하면 거래 성사율이 높아집니다."
          maxLength={2000}
          rows={10}
          className="step-input min-h-[240px] resize-y"
        />
        <p className="mt-1 text-right text-xs text-gray-400">{form.description.length}/2,000</p>
      </div>

      {/* Transfer Reason */}
      <div>
        <SectionLabel>양도 사유 <span className="text-xs font-normal text-gray-400">(선택)</span></SectionLabel>
        <textarea
          value={form.transferReason}
          onChange={(e) => update("transferReason", e.target.value)}
          placeholder={"매수자가 안심할 수 있도록 양도 사유를 작성해주세요\n예: 가족과 함께 지방으로 이주하게 되어 양도합니다, 다른 업종으로 전환하기 위해 양도합니다"}
          maxLength={500}
          rows={3}
          className="step-input resize-y"
        />
        {form.transferReason.length > 0 && form.transferReason.length < 20 && (
          <p className="mt-1 text-xs text-orange-500">💡 양도사유를 자세히 적으면 매수자의 신뢰가 높아집니다</p>
        )}
        {form.transferReason.length >= 20 && (
          <p className="mt-1 text-xs text-green-600">✓ 좋은 설명이에요!</p>
        )}
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
        <div>
          <p className="text-sm font-medium text-orange-700">주의사항</p>
          <p className="mt-1 text-xs leading-relaxed text-orange-600">
            설명에 전화번호, 이메일, SNS 주소 등 연락처를 직접 기재하면 등록이 반려될 수 있습니다. 연락처는 다음 단계에서 별도로 입력해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STEP 6: 매출증빙자료와 매물사진
   ═══════════════════════════════════════════════════ */

function Step6Photos({
  form, update, setUploadedImages, uploadedDocs, setUploadedDocs,
}: {
  form: FormData;
  update: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  setUploadedImages: (imgs: { key: string; url: string; category?: string }[]) => void;
  uploadedDocs: { name: string; key: string; url: string; previewUrl?: string; size?: number; mimeType?: string }[];
  setUploadedDocs: (docs: { name: string; key: string; url: string; previewUrl?: string; size?: number; mimeType?: string }[]) => void;
}) {
  const { toast } = useToast();
  const previewUrlsRef = useRef<string[]>([]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="space-y-6">
      {/* Photo Upload */}
      <div>
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-navy" />
          <SectionLabel>매물 사진</SectionLabel>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          카테고리별로 사진을 올려주세요. 외부/내부 전경은 필수입니다.
        </p>
        <div className="mt-3">
          <ImageUploader listingId="new" onImagesChange={setUploadedImages} />
        </div>
      </div>

      {/* Revenue Document Upload */}
      <div>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-navy" />
          <SectionLabel>매출 증빙자료 (선택)</SectionLabel>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          매출 증빙자료를 첨부하면 매물 신뢰도가 높아져 거래 성사율이 올라갑니다.
        </p>

        {/* 개인정보 보호 안내 */}
        <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm font-medium text-yellow-800">
            개인정보 보호 안내
          </p>
          <p className="mt-1 text-xs leading-relaxed text-yellow-700">
            매출 증빙자료에 포함된 <strong>주민등록번호, 전화번호, 주소 등 개인정보</strong>는
            업로드 전에 반드시 가려주세요. 가리지 않고 업로드할 경우 개인정보 유출의 책임은 업로더에게 있습니다.
          </p>
          <ul className="mt-2 space-y-1 text-xs text-yellow-700">
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5 shrink-0">&#8226;</span>
              사업자등록번호, 대표자명은 노출되어도 무방합니다
            </li>
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5 shrink-0">&#8226;</span>
              홈택스 캡처 시 주민번호 뒷자리를 가려주세요
            </li>
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5 shrink-0">&#8226;</span>
              PDF는 업로드 전 민감정보 영역을 흑색 박스로 처리해주세요
            </li>
          </ul>
        </div>

        <label className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-6 text-sm text-gray-400 transition-colors hover:border-navy hover:text-navy">
          <FileText className="h-5 w-5" />
          매출 증빙자료 업로드 (PDF, 이미지)
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const fd = new FormData();
              fd.append("file", file);
              fd.append("metadata", JSON.stringify({
                documentType: "OTHER",
                accessLevel: "OWNER_ONLY",
                consentGiven: true,
              }));
              try {
                const res = await fetch("/api/upload/document", { method: "POST", body: fd });
                const json = await res.json();
                if (json.data) {
                  const isImage = file.type.startsWith("image/");
                  let previewUrl: string | undefined;
                  if (isImage) {
                    previewUrl = URL.createObjectURL(file);
                    previewUrlsRef.current.push(previewUrl);
                  }
                  setUploadedDocs([...uploadedDocs, {
                    name: file.name,
                    key: json.data.key as string,
                    url: "",
                    previewUrl,
                    size: file.size,
                    mimeType: file.type,
                  }]);
                } else {
                  toast("error", json.error?.message ?? "업로드에 실패했습니다.");
                }
              } catch {
                toast("error", "파일 업로드 중 오류가 발생했습니다.");
              }
              e.target.value = "";
            }}
          />
        </label>
        {uploadedDocs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3">
            {uploadedDocs.map((doc, i) => (
              <div key={doc.key} className="group relative flex w-24 flex-col items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 p-2">
                {/* Preview */}
                {doc.previewUrl ? (
                  <div className="relative h-20 w-20 overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={doc.previewUrl} alt={doc.name} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-200">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                {/* File info */}
                <p className="w-full truncate text-center text-[10px] text-gray-600" title={doc.name}>
                  {doc.name}
                </p>
                {doc.size && (
                  <p className="text-[9px] text-gray-400">{formatFileSize(doc.size)}</p>
                )}
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => {
                    if (doc.previewUrl) URL.revokeObjectURL(doc.previewUrl);
                    setUploadedDocs(uploadedDocs.filter((_, idx) => idx !== i));
                  }}
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-navy" />
            <span className="text-sm font-medium text-gray-700">
              {form.contactVisible ? "연락처 공개" : "연락처 비공개"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => update("contactVisible", !form.contactVisible)}
            className={`relative h-6 w-11 rounded-full transition-colors ${form.contactVisible ? "bg-navy" : "bg-gray-300"}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.contactVisible ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
        {!form.contactVisible && (
          <p className="mt-2 text-xs text-gray-400">문의는 플랫폼 메시지로만 가능합니다</p>
        )}
        {form.contactVisible && (
          <div className="mt-4 space-y-3">
            <div>
              <SectionLabel>전화번호</SectionLabel>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => update("contactPhone", e.target.value)}
                placeholder="010-1234-5678"
                className="step-input"
              />
            </div>
            <div>
              <SectionLabel>이메일</SectionLabel>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => update("contactEmail", e.target.value)}
                placeholder="seller@example.com"
                className="step-input"
              />
            </div>

            {/* Phone Public Toggle */}
            {form.contactPhone && (
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">전화번호 공개</span>
                  <p className="mt-0.5 text-xs text-gray-500">
                    전화번호를 매물 상세에서 공개합니다
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => update("isPhonePublic", !form.isPhonePublic)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${form.isPhonePublic ? "bg-navy" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.isPhonePublic ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STEP 7: 매출 매입자료 연동
   ═══════════════════════════════════════════════════ */

function Step7Integration() {
  const integrations: { provider: string; label: string; desc: string; color: string; icon: string }[] = [
    { provider: "hometax", label: "홈택스", desc: "매출/매입 세금계산서 자동 연동", color: "bg-blue-500", icon: "🏛️" },
    { provider: "crefia", label: "여신금융협회", desc: "카드 매출 데이터 연동", color: "bg-green-600", icon: "💳" },
    { provider: "baemin", label: "배달의민족", desc: "배민 매출 데이터 연동", color: "bg-sky-400", icon: "🛵" },
    { provider: "yogiyo", label: "요기요", desc: "요기요 매출 데이터 연동", color: "bg-red-500", icon: "🍽️" },
    { provider: "coupangeats", label: "쿠팡이츠", desc: "쿠팡이츠 매출 데이터 연동", color: "bg-yellow-500", icon: "📦" },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-navy/20 bg-navy/5 p-4">
        <div className="flex items-start gap-3">
          <Link2 className="mt-0.5 h-5 w-5 text-navy" />
          <div>
            <p className="text-sm font-medium text-gray-800">매출 데이터를 연동하면 매물 신뢰도가 높아집니다.</p>
            <p className="mt-1 text-xs text-gray-500">연동 기능은 현재 준비 중이며, 곧 제공될 예정입니다.</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {integrations.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.color} text-xl text-white opacity-50`}>
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
            <button
              type="button"
              disabled
              className="rounded-lg bg-gray-100 px-4 py-2 text-xs font-bold text-gray-400 cursor-not-allowed"
            >
              준비 중
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-400">
        연동 기능은 준비 중이며, 나중에 마이페이지에서 연동할 수 있습니다.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Shared Sub-Components
   ═══════════════════════════════════════════════════ */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-sm font-medium text-gray-700">{children}</p>;
}

function ChipButton({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
        active
          ? "border-navy bg-navy text-white shadow-sm"
          : "border-gray-200 bg-white text-gray-600 hover:border-navy/40 hover:bg-navy/5"
      }`}
    >
      {children}
    </button>
  );
}

function RadioCard({
  active, onClick, label, desc,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  desc?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-all ${
        active
          ? "border-navy bg-navy/5 ring-1 ring-navy/30"
          : "border-gray-200 bg-white hover:border-navy/30"
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${active ? "border-navy" : "border-gray-300"}`}>
          {active && <div className="h-2.5 w-2.5 rounded-full bg-navy" />}
        </div>
        <span className={`text-sm font-medium ${active ? "text-navy" : "text-gray-700"}`}>{label}</span>
      </div>
      {desc && <p className="mt-1 pl-7 text-xs text-gray-500">{desc}</p>}
    </button>
  );
}

function ExpenseRow({
  label, value, onChange, pct,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  pct: number | null;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-sm font-bold text-navy">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        value={addCommas(value)}
        onChange={(e) => onChange(stripCommas(e.target.value))}
        placeholder="0"
        className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-right text-sm outline-none transition-colors focus:border-navy focus:ring-1 focus:ring-navy/20"
      />
      <span className="shrink-0 text-sm text-gray-500">만원</span>
      <span className="w-10 shrink-0 text-right text-xs text-gray-400">
        {pct !== null ? `${pct}%` : ""}
      </span>
    </div>
  );
}

function StaffInput({
  label, value, onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-xs text-gray-500">{label}</p>
      <div className="relative">
        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className="w-full rounded-lg border border-gray-200 px-3 py-1.5 pr-8 text-right text-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy/20"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">명</span>
      </div>
    </div>
  );
}

function ManwonInput({
  value, onChange, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="mt-1 flex items-center gap-2">
      <input
        type="text"
        inputMode="numeric"
        value={addCommas(value)}
        onChange={(e) => onChange(stripCommas(e.target.value))}
        placeholder={placeholder}
        className="step-input flex-1 text-right"
      />
      <span className="shrink-0 text-sm font-medium text-gray-500">만원</span>
    </div>
  );
}

function InlineLabelInput({
  label, value, onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-sm font-bold text-navy">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        value={addCommas(value)}
        onChange={(e) => onChange(stripCommas(e.target.value))}
        placeholder="숫자만 입력"
        className="step-input flex-1 text-right"
      />
      <span className="shrink-0 text-sm font-medium text-gray-500">만원</span>
    </div>
  );
}

function DescHint({ text }: { text: string }) {
  if (!text || text.length === 0) return null;
  if (text.length >= 20) {
    return <p className="mt-1 text-xs text-green-600">&#10003; 좋은 설명이에요!</p>;
  }
  return <p className="mt-1 text-xs text-orange-500">&#128161; 더 자세히 작성하면 매물 문의가 2배 증가합니다</p>;
}

function PremiumBreakdownOpen({
  label, value, onValueChange, desc, onDescChange, placeholder,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  desc: string;
  onDescChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="rounded-lg border border-navy/20 bg-white p-3">
      <p className="mb-2 text-sm font-medium text-navy">{label}</p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          required
          value={addCommas(value)}
          onChange={(e) => onValueChange(stripCommas(e.target.value))}
          placeholder="숫자만 입력"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-right text-sm outline-none transition-colors focus:border-navy focus:ring-1 focus:ring-navy/20"
        />
        <span className="shrink-0 text-xs font-medium text-gray-500">만원</span>
      </div>
      <textarea
        value={desc}
        onChange={(e) => onDescChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-navy focus:ring-1 focus:ring-navy/20 placeholder:text-gray-400 resize-none"
      />
      <DescHint text={desc} />
    </div>
  );
}

function FloorPremiumAuto({
  totalPremium, goodwill, facility, onValueChange, desc, onDescChange,
}: {
  totalPremium: number;
  goodwill: number;
  facility: number;
  onValueChange: (v: string) => void;
  desc: string;
  onDescChange: (v: string) => void;
}) {
  const autoCalc = Math.max(totalPremium - goodwill - facility, 0);
  const overflow = goodwill + facility > totalPremium && totalPremium > 0;
  const displayValue = overflow ? "0" : String(autoCalc);

  // Always sync value with auto-calculated result
  useEffect(() => {
    onValueChange(displayValue);
  }, [displayValue, onValueChange]);

  return (
    <div className="rounded-lg border border-navy/20 bg-white p-3">
      <p className="mb-2 text-sm font-medium text-navy">바닥권리금 (자동계산)</p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          value={addCommas(displayValue)}
          disabled
          className={`flex-1 rounded-lg border px-3 py-2 text-right text-sm outline-none bg-gray-50 text-gray-700 cursor-not-allowed ${
            overflow ? "border-red-300 bg-red-50" : "border-gray-200"
          }`}
        />
        <span className="shrink-0 text-xs font-medium text-gray-500">만원</span>
      </div>
      {overflow && (
        <p className="mt-1 text-xs text-red-500">
          영업권리금과 시설권리금의 합이 총 권리금을 초과합니다.
        </p>
      )}
      <textarea
        value={desc}
        onChange={(e) => onDescChange(e.target.value)}
        placeholder={"입지 장점, 유동인구, 상권 특성 등을 작성해주세요\n예) 역세권 도보 2분, 대로변 코너 1층, 3면 간판 노출, 유동인구 일 5,000명"}
        rows={3}
        className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-navy focus:ring-1 focus:ring-navy/20 placeholder:text-gray-400 resize-none"
      />
      <DescHint text={desc} />
    </div>
  );
}
