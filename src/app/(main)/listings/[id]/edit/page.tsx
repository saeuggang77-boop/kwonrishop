"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { BUSINESS_CATEGORY_LABELS, STORE_TYPE_LABELS } from "@/lib/utils/constants";
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">업종</label>
              <select value={form.businessCategory} onChange={(e) => update("businessCategory", e.target.value)} className="input-field">
                {Object.entries(BUSINESS_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">상가유형</label>
              <select value={form.storeType} onChange={(e) => update("storeType", e.target.value)} className="input-field">
                {Object.entries(STORE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">세부업종</label>
            <input value={form.businessSubtype} onChange={(e) => update("businessSubtype", e.target.value)} className="input-field" placeholder="예: 삼겹살, 카페" />
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
              <label className="mb-1 block text-sm font-medium text-gray-700">월수익 (원)</label>
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
