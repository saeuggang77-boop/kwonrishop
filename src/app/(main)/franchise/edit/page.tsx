"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import AdProductInlineSelect from "@/components/promotion/AdProductInlineSelect";

interface FranchiseBrand {
  id: string;
  brandName: string;
  companyName: string;
  industry: string;
  description: string | null;
  benefits: string | null;
  website: string | null;
  tier: string | null;
  ftcId: string | null;
}

export default function FranchiseEditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [brand, setBrand] = useState<FranchiseBrand | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState("");
  const [benefits, setBenefits] = useState("");
  const [website, setWebsite] = useState("");
  const [isManual, setIsManual] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/franchise/edit");
      return;
    }

    if (status === "authenticated") {
      fetch("/api/mypage")
        .then((r) => r.json())
        .then((data) => {
          if (data.franchiseBrand) {
            setBrand(data.franchiseBrand);
            fetch(`/api/franchise/${data.franchiseBrand.id}`)
              .then((r) => r.json())
              .then((brandData) => {
                const manual = brandData.ftcId?.startsWith("manual_") || false;
                setIsManual(manual);
                setBrandName(brandData.brandName || "");
                setCompanyName(brandData.companyName || "");
                setIndustry(brandData.industry || "");
                setDescription(brandData.description || "");
                setBenefits(brandData.benefits || "");
                setWebsite(brandData.website || "");
                setLoading(false);
              })
              .catch(() => setLoading(false));
          } else {
            toast.error("프랜차이즈 본사 계정이 아닙니다.");
            router.push("/mypage");
          }
        })
        .catch(() => {
          toast.error("데이터를 불러오는데 실패했습니다.");
          router.push("/mypage");
        });
    }
  }, [status, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!brand) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/franchise/${brand.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim() || null,
          benefits: benefits.trim() || null,
          website: website.trim() || null,
          ...(isManual && {
            brandName: brandName.trim() || "미등록 브랜드",
            companyName: companyName.trim() || "",
            industry: industry.trim() || "기타",
          }),
        }),
      });

      if (res.ok) {
        toast.success("브랜드 정보가 저장되었습니다.");
        router.push(`/franchise/${brand.id}`);
      } else {
        const data = await res.json();
        toast.error(data.error || "저장에 실패했습니다.");
      }
    } catch {
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!brand) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">브랜드 정보 수정</h1>
        <p className="text-sm text-gray-500">
          {brand.brandName} ({brand.companyName})
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">
            {isManual ? "기본 정보" : "기본 정보 (공정위 등록 정보)"}
          </h3>

          {isManual ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">브랜드명 *</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  required
                  placeholder="브랜드명을 입력하세요"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">회사명</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="법인명 또는 상호를 입력하세요"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">업종</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="예: 치킨, 카페, 편의점 등"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none"
                />
              </div>
              <div className="flex">
                <span className="w-24 text-sm text-gray-500">등급</span>
                <span className="text-sm text-gray-900">{brand.tier || "FREE"}</span>
              </div>
              <p className="text-xs text-navy-700 bg-navy-50 rounded-lg p-3">
                공정위 미등록 브랜드입니다. 브랜드명, 회사명, 업종을 직접 수정할 수 있습니다.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="w-24 text-gray-500">브랜드명</span>
                  <span className="text-gray-900">{brand.brandName}</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-gray-500">업종</span>
                  <span className="text-gray-900">{brand.industry}</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-gray-500">등급</span>
                  <span className="text-gray-900">{brand.tier || "FREE"}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                * 기본 정보는 공정위 등록 데이터로 수정할 수 없습니다.
              </p>
            </>
          )}
        </div>

        {/* 브랜드 소개 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            브랜드 소개
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="브랜드를 소개하는 내용을 입력하세요"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            브랜드의 특징, 비전, 차별점 등을 자유롭게 작성하세요.
          </p>
        </div>

        {/* 창업특혜 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            창업특혜
          </label>
          <textarea
            value={benefits}
            onChange={(e) => setBenefits(e.target.value)}
            rows={6}
            placeholder="가맹점주에게 제공하는 특혜를 입력하세요"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            예: 초기 홍보 지원, 교육 프로그램, 인테리어 지원 등
          </p>
        </div>

        {/* 웹사이트 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            웹사이트 URL
          </label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            브랜드 공식 웹사이트 주소를 입력하세요.
          </p>
        </div>

        {/* 유료 구독 인라인 선택 (무료 등급일 때만) */}
        {brand.tier === null && (
          <div className="bg-navy-50 border border-navy-200 rounded-xl p-5">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-navy-900 mb-1">💎 브랜드 노출을 강화하세요</h4>
              <p className="text-xs text-navy-700">
                유료 구독 시 메인 노출, 전용 상세 페이지, 문의 접수 등 추가 기능을 이용할 수 있습니다.
              </p>
            </div>
            <AdProductInlineSelect
              scope="FRANCHISE"
              onSkip={() => router.push(`/franchise/${brand.id}`)}
              skipLabel="나중에 하기"
            />
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push(`/franchise/${brand.id}`)}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 bg-navy-700 text-white rounded-xl font-medium hover:bg-navy-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>
    </div>
  );
}
