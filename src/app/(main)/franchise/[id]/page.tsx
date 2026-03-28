"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import dynamic from "next/dynamic";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { toast } from "@/lib/toast";

const IndustryRevenueSection = dynamic(
  () => import("@/components/franchise/IndustryRevenueSection"),
  {
    loading: () => (
      <div className="space-y-4">
        <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    ),
  }
);

const CrossSellSection = dynamic(() => import("@/components/shared/CrossSellSection"), {
  ssr: false,
});

interface FranchiseBrand {
  id: string;
  brandName: string;
  companyName: string;
  industry: string;
  description: string | null;
  franchiseFee: number | null;
  educationFee: number | null;
  depositFee: number | null;
  royalty: string | null;
  totalStores: number | null;
  avgRevenue: number | null;
  website: string | null;
  benefits: string | null;
  bannerImage: string | null;
  tier: "GOLD" | "SILVER" | "BRONZE" | null;
  ftcId: string | null;
  ftcRegisteredAt: string | null;
  ftcRawData: any;
}

export default function FranchiseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const id = params.id as string;

  const [brand, setBrand] = useState<FranchiseBrand | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");

  // Inquiry form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/franchise/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setBrand(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (brand) {
      document.title = `${brand.brandName} - 프랜차이즈 - 권리샵`;
    }
  }, [brand]);

  async function handleInquirySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      toast.info("로그인이 필요합니다");
      router.push("/auth/login");
      return;
    }

    setSubmitting(true);
    const res = await fetch(`/api/franchise/${id}/inquiry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, message }),
    });

    if (res.ok) {
      toast.success("문의가 접수되었습니다");
      setName("");
      setPhone("");
      setMessage("");
    } else {
      toast.error("문의 접수에 실패했습니다");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-gray-100 rounded-xl h-64 animate-pulse mb-6" />
        <div className="bg-gray-100 rounded-xl h-96 animate-pulse" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-400">브랜드를 찾을 수 없습니다</p>
      </div>
    );
  }

  // JSON-LD structured data
  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": brand.brandName,
    "description": brand.description || `${brand.brandName} 프랜차이즈 정보`,
    "url": brand.website || undefined,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Breadcrumb items={[{ label: "프랜차이즈", href: "/franchise" }, { label: brand.brandName }]} />
      <JsonLd data={jsonLdData} />
      {/* Banner */}
      {brand.bannerImage && (
        <div className="mb-6 rounded-xl overflow-hidden relative h-64">
          <Image src={brand.bannerImage} alt={brand.brandName} fill className="object-cover" priority />
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl shrink-0">
            {brand.brandName.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{brand.brandName}</h1>
              {brand.ftcId && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  공정위 등록 브랜드
                </span>
              )}
              {brand.tier && (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    brand.tier === "GOLD"
                      ? "bg-yellow-100 text-yellow-800"
                      : brand.tier === "SILVER"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {brand.tier}
                </span>
              )}
            </div>
            <p className="text-gray-600">{brand.companyName}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {[
            { id: "info", label: "기본정보" },
            { id: "fees", label: "창업비용" },
            { id: "benefits", label: "창업특혜" },
            { id: "analysis", label: "업종분석" },
            { id: "inquiry", label: "문의하기" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[80px] px-3 md:px-6 py-3 md:py-4 font-medium transition-colors text-sm md:text-base whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* 기본정보 */}
          {activeTab === "info" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">업종</span>
                  <p className="font-medium text-gray-900 mt-1">{brand.industry}</p>
                </div>
                {brand.totalStores !== null && (
                  <div>
                    <span className="text-sm text-gray-600">전체 매장수</span>
                    <p className="font-medium text-gray-900 mt-1">
                      {brand.totalStores.toLocaleString()}개
                    </p>
                  </div>
                )}
                {brand.avgRevenue !== null && (
                  <div>
                    <span className="text-sm text-gray-600">평균 매출</span>
                    <p className="font-medium text-gray-900 mt-1">
                      월 {brand.avgRevenue.toLocaleString()}만원
                    </p>
                  </div>
                )}
                {brand.ftcRegisteredAt && (
                  <div>
                    <span className="text-sm text-gray-600">공정위 등록일</span>
                    <p className="font-medium text-gray-900 mt-1">{brand.ftcRegisteredAt}</p>
                  </div>
                )}
                {brand.website && (
                  <div>
                    <span className="text-sm text-gray-600">웹사이트</span>
                    <a
                      href={brand.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline mt-1 block"
                    >
                      {brand.website}
                    </a>
                  </div>
                )}
              </div>
              {brand.description && (
                <div className="pt-4 border-t border-gray-200">
                  <span className="text-sm text-gray-600">브랜드 소개</span>
                  <p className="text-gray-900 mt-2 whitespace-pre-wrap">{brand.description}</p>
                </div>
              )}
              {brand.ftcRawData && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">📋</span>
                      <h4 className="font-medium text-gray-900">공정위 정보공개서</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      이 브랜드는 공정거래위원회에 정식 등록된 프랜차이즈입니다.
                    </p>
                    {brand.ftcId && (
                      <a
                        href={`https://franchise.ftc.go.kr/mnu/00013/program/userRqst/view.do?firMstSn=${brand.ftcId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        공정위 정보공개서 원문 보기 →
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 창업비용 */}
          {activeTab === "fees" && (
            <div className="space-y-3 overflow-x-auto">
              {brand.franchiseFee !== null && (
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600 text-sm md:text-base">가맹비</span>
                  <span className="font-medium text-gray-900 text-sm md:text-base">
                    {brand.franchiseFee.toLocaleString()}만원
                  </span>
                </div>
              )}
              {brand.educationFee !== null && (
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600 text-sm md:text-base">교육비</span>
                  <span className="font-medium text-gray-900 text-sm md:text-base">
                    {brand.educationFee.toLocaleString()}만원
                  </span>
                </div>
              )}
              {brand.depositFee !== null && (
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600 text-sm md:text-base">보증금</span>
                  <span className="font-medium text-gray-900 text-sm md:text-base">
                    {brand.depositFee.toLocaleString()}만원
                  </span>
                </div>
              )}
              {brand.royalty !== null && (
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600 text-sm md:text-base">로열티</span>
                  <span className="font-medium text-gray-900 text-sm md:text-base">{brand.royalty}%</span>
                </div>
              )}
              <div className="bg-blue-50 rounded-lg p-3 md:p-4 mt-4">
                <p className="text-xs md:text-sm text-blue-800">
                  * 상기 비용은 예상 금액이며, 실제 창업 비용은 매장 규모 및 지역에 따라 달라질 수
                  있습니다.
                </p>
              </div>
            </div>
          )}

          {/* 창업특혜 */}
          {activeTab === "benefits" && (
            <div>
              {brand.benefits ? (
                <div className="prose max-w-none">
                  <p className="text-gray-900 whitespace-pre-wrap">{brand.benefits}</p>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p>등록된 창업특혜 정보가 없습니다</p>
                </div>
              )}
            </div>
          )}

          {/* 업종분석 */}
          {activeTab === "analysis" && (
            <IndustryRevenueSection
              industry={brand.industry}
              brandName={brand.brandName}
              brandAvgRevenue={brand.avgRevenue}
            />
          )}

          {/* 문의하기 */}
          {activeTab === "inquiry" && (
            <form onSubmit={handleInquirySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="이름을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">연락처</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="010-0000-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">문의내용</label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  placeholder="문의하실 내용을 입력하세요"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {submitting ? "전송 중..." : "문의하기"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 크로스셀 추천 */}
      <CrossSellSection type="franchise" id={id} />
    </div>
  );
}
