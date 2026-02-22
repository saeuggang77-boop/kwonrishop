"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { BUSINESS_CATEGORY_LABELS, BUSINESS_SUBCATEGORIES, STORE_TYPE_LABELS } from "@/lib/utils/constants";
import { useToast } from "@/components/ui/toast";

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [form, setForm] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then((r) => r.json())
      .then((data) => {
        const l = data.data ?? data;
        setForm({
          title: l.title ?? "",
          description: l.description ?? "",
          businessCategory: l.businessCategory ?? "",
          storeType: l.storeType ?? "",
          price: l.price ?? "",
          monthlyRent: l.monthlyRent ?? "",
          premiumFee: l.premiumFee ?? "",
          managementFee: l.managementFee ?? "",
          monthlyRevenue: l.monthlyRevenue ?? "",
          monthlyProfit: l.monthlyProfit ?? "",
          operatingYears: l.operatingYears ?? "",
          businessSubtype: l.businessSubtype ?? "",
          address: l.address ?? "",
          city: l.city ?? "",
          district: l.district ?? "",
          contactPhone: l.contactPhone ?? "",
          contactEmail: l.contactEmail ?? "",
          goodwillPremium: l.goodwillPremium?.toString() ?? "",
          goodwillPremiumDesc: l.goodwillPremiumDesc ?? "",
          facilityPremium: l.facilityPremium?.toString() ?? "",
          facilityPremiumDesc: l.facilityPremiumDesc ?? "",
          floorPremium: l.floorPremium?.toString() ?? "",
          floorPremiumDesc: l.floorPremiumDesc ?? "",
        });
        setIsLoading(false);
      })
      .catch(() => {
        setErrorMsg("매물을 불러올 수 없습니다.");
        setIsLoading(false);
      });
  }, [id]);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) {
      toast("info", "제목을 입력해주세요.");
      return;
    }
    if (!form.description?.trim()) {
      toast("info", "설명을 입력해주세요.");
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      toast("info", "보증금을 올바르게 입력해주세요.");
      return;
    }
    setIsSaving(true);
    setErrorMsg("");

    const body: Record<string, unknown> = { ...form };
    if (form.price) body.price = Number(form.price);
    if (form.monthlyRent) body.monthlyRent = Number(form.monthlyRent);
    if (form.premiumFee) body.premiumFee = Number(form.premiumFee);
    if (form.managementFee) body.managementFee = Number(form.managementFee);
    if (form.monthlyRevenue) body.monthlyRevenue = Number(form.monthlyRevenue);
    if (form.monthlyProfit) body.monthlyProfit = Number(form.monthlyProfit);
    if (form.operatingYears) body.operatingYears = Number(form.operatingYears);
    if (form.goodwillPremium) body.goodwillPremium = Number(form.goodwillPremium);
    else body.goodwillPremium = null;
    body.goodwillPremiumDesc = form.goodwillPremiumDesc || null;
    if (form.facilityPremium) body.facilityPremium = Number(form.facilityPremium);
    else body.facilityPremium = null;
    body.facilityPremiumDesc = form.facilityPremiumDesc || null;
    if (form.floorPremium) body.floorPremium = Number(form.floorPremium);
    else body.floorPremium = null;
    body.floorPremiumDesc = form.floorPremiumDesc || null;

    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        router.push(`/listings/${id}`);
      } else {
        const data = await res.json();
        setErrorMsg(data.error?.message ?? "수정에 실패했습니다.");
      }
    } catch {
      setErrorMsg("서버 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-gray-400">로딩 중...</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-navy">매물 수정</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {errorMsg && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{errorMsg}</div>}

        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">제목</label>
            <input value={form.title} onChange={(e) => update("title", e.target.value)} className="input-field" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">업종 대분류</label>
              <select
                value={Object.entries(BUSINESS_SUBCATEGORIES).find(([, subs]) =>
                  subs.some((s) => s.key === form.businessCategory && (s.subtype ? s.subtype === form.businessSubtype : true))
                )?.[0] ?? ""}
                onChange={(e) => {
                  const group = e.target.value;
                  const firstSub = BUSINESS_SUBCATEGORIES[group]?.[0];
                  if (firstSub) {
                    update("businessCategory", firstSub.key);
                    update("businessSubtype", firstSub.subtype ?? "");
                  }
                }}
                className="input-field"
              >
                <option value="">선택</option>
                {Object.keys(BUSINESS_SUBCATEGORIES).map((group) => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">세부업종</label>
              <select
                value={form.businessSubtype ? `${form.businessCategory}::${form.businessSubtype}` : form.businessCategory}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.includes("::")) {
                    const [cat, sub] = val.split("::");
                    update("businessCategory", cat);
                    update("businessSubtype", sub);
                  } else {
                    update("businessCategory", val);
                    update("businessSubtype", "");
                  }
                }}
                className="input-field"
              >
                <option value="">선택</option>
                {Object.values(BUSINESS_SUBCATEGORIES).flat().filter((sub) => {
                  // Show all if no group selected, or filter by matching category
                  const currentGroup = Object.entries(BUSINESS_SUBCATEGORIES).find(([, subs]) =>
                    subs.some((s) => s.key === form.businessCategory && (s.subtype ? s.subtype === form.businessSubtype : true))
                  )?.[0];
                  if (!currentGroup) return true;
                  return BUSINESS_SUBCATEGORIES[currentGroup]?.includes(sub);
                }).map((sub) => (
                  <option key={sub.subtype ?? sub.key} value={sub.subtype ? `${sub.key}::${sub.subtype}` : sub.key}>
                    {sub.emoji} {sub.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">상가유형</label>
              <select value={form.storeType} onChange={(e) => update("storeType", e.target.value)} className="input-field">
                {Object.entries(STORE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">보증금 (원)</label>
              <input type="number" value={form.price} onChange={(e) => update("price", e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">월세 (원)</label>
              <input type="number" value={form.monthlyRent} onChange={(e) => update("monthlyRent", e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">권리금 (원)</label>
              <input type="number" value={form.premiumFee} onChange={(e) => update("premiumFee", e.target.value)} className="input-field" />
            </div>
          </div>
          {/* 권리금 세부내역 */}
          {(form.premiumFee && Number(form.premiumFee) > 0) && (
            <div className="rounded-lg border border-purple/20 bg-purple-50/50 p-4 space-y-3">
              <p className="text-sm font-bold text-purple">권리금 세부내역 (선택)</p>
              <p className="text-xs text-gray-500">권리금의 구성을 설명하면 매수자 신뢰도가 높아집니다.</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">영업권리금 (만원)</label>
                  <input type="number" value={form.goodwillPremium} onChange={(e) => update("goodwillPremium", e.target.value)} placeholder="예: 3000" className="input-field text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">시설권리금 (만원)</label>
                  <input type="number" value={form.facilityPremium} onChange={(e) => update("facilityPremium", e.target.value)} placeholder="예: 2000" className="input-field text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">바닥권리금 (만원)</label>
                  <input type="number" value={form.floorPremium} onChange={(e) => update("floorPremium", e.target.value)} placeholder="예: 1000" className="input-field text-sm" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">영업권리금 설명</label>
                <textarea rows={2} value={form.goodwillPremiumDesc} onChange={(e) => update("goodwillPremiumDesc", e.target.value)} placeholder="예: 월평균 매출 2,500만원, 단골 고객 300명 이상 확보" className="input-field text-sm resize-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">시설권리금 설명</label>
                <textarea rows={2} value={form.facilityPremiumDesc} onChange={(e) => update("facilityPremiumDesc", e.target.value)} placeholder="예: 2023년 전체 인테리어 리모델링 (5,000만원 투자)" className="input-field text-sm resize-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">바닥권리금 설명</label>
                <textarea rows={2} value={form.floorPremiumDesc} onChange={(e) => update("floorPremiumDesc", e.target.value)} placeholder="예: 역세권 도보 3분, 유동인구 일 5,000명 이상" className="input-field text-sm resize-none" />
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">관리비 (원)</label>
              <input type="number" value={form.managementFee} onChange={(e) => update("managementFee", e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">월매출 (원)</label>
              <input type="number" value={form.monthlyRevenue} onChange={(e) => update("monthlyRevenue", e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">월순이익 (원)</label>
              <input type="number" value={form.monthlyProfit} onChange={(e) => update("monthlyProfit", e.target.value)} className="input-field" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">영업기간 (년)</label>
            <input type="number" value={form.operatingYears} onChange={(e) => update("operatingYears", e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">상세 설명</label>
            <textarea rows={5} value={form.description} onChange={(e) => update("description", e.target.value)} className="input-field resize-y" />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={isSaving} className="rounded-lg bg-navy px-8 py-3 text-sm font-medium text-white hover:bg-navy-dark disabled:opacity-50">
            {isSaving ? "저장 중..." : "수정 완료"}
          </button>
          <Link href={`/listings/${id}`} className="rounded-lg border border-gray-300 px-8 py-3 text-sm text-gray-600 hover:bg-gray-50">
            취소
          </Link>
        </div>
      </form>
    </div>
  );
}
