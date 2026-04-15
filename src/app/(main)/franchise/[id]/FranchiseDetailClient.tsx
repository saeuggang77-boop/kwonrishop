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
  { loading: () => <div className="space-y-4"><div className="h-32 bg-gray-100 rounded-xl animate-pulse" /><div className="h-48 bg-gray-100 rounded-xl animate-pulse" /></div> }
);

const StartupPartnerSection = dynamic(() => import("@/components/listing/StartupPartnerSection"), { ssr: false });

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
  tier: "GOLD" | "SILVER" | "BRONZE" | "FREE" | null;
  ftcId: string | null;
  ftcRegisteredAt: string | null;
  ftcRawData: {
    newStores?: number;
    contractEnd?: number;
    contractCancel?: number;
    revenuePerArea?: number;
    year?: string;
  } | null;
  managerId: boolean | null;
  representativeName: string | null;
  businessNumber: string | null;
  ftcDocId: string | null;
  representativePhone: string | null;
  headquarterAddress: string | null;
  establishedDate: string | null;
  franchiseStartDate: string | null;
  contractPeriod: string | null;
  interiorCost: string | null;
  adPromotionFee: string | null;
  territoryProtection: boolean | null;
  companyOwnedStores: number | null;
  financialSummary: {
    year?: string;
    totalAssets?: string;
    revenue?: string;
    operatingProfit?: string;
    netProfit?: string;
  } | null;
  regionalStores: Record<string, number> | null;
  majorProductName: string | null;
}

export default function FranchiseDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const id = params.id as string;

  const [brand, setBrand] = useState<FranchiseBrand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadBrand = () => {
    setLoading(true);
    setError(false);
    fetch(`/api/franchise/${id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => {
        setBrand(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadBrand();
  }, [id]);

  async function handleInquirySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) { toast.info("로그인이 필요합니다"); router.push("/login"); return; }
    setSubmitting(true);
    const res = await fetch(`/api/franchise/${id}/inquiry`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phone, message }) });
    if (res.ok) { toast.success("문의가 접수되었습니다"); setName(""); setPhone(""); setMessage(""); }
    else { toast.error("문의 접수에 실패했습니다"); }
    setSubmitting(false);
  }

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-6"><div className="bg-gray-100 rounded-xl h-64 animate-pulse mb-6" /><div className="bg-gray-100 rounded-xl h-96 animate-pulse" /></div>;
  if (error || !brand) return (
    <div className="max-w-5xl mx-auto px-4 py-20 text-center">
      <p className="text-gray-400 mb-4">브랜드 정보를 불러올 수 없습니다</p>
      <button onClick={loadBrand} className="px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600">다시 시도</button>
    </div>
  );

  const jsonLdData = { "@context": "https://schema.org", "@type": "Organization", "name": brand.brandName, "description": brand.description || `${brand.brandName} 프랜차이즈 정보`, "url": brand.website || undefined };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Breadcrumb items={[{ label: "프랜차이즈", href: "/franchise" }, { label: brand.brandName }]} />
      <JsonLd data={jsonLdData} />
      {brand.bannerImage && (<div className="mb-6 rounded-xl overflow-hidden relative h-64"><Image src={brand.bannerImage} alt={brand.brandName} fill className="object-cover" priority /></div>)}

      <div className="bg-cream rounded-3xl border border-line p-6 mb-6 shadow-[0_2px_12px_rgba(31,63,46,0.06)]">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-green-700 flex items-center justify-center shrink-0">
            <span className="font-serif italic font-light text-3xl text-terra-300">{brand.brandName.charAt(0)}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-extrabold text-green-700 tracking-tight">{brand.brandName}</h1>
              {brand.ftcId && <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-green-100 text-green-700">공정위 등록</span>}
              {brand.tier && <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${brand.tier === "GOLD" ? "bg-terra-500 text-cream" : brand.tier === "SILVER" ? "bg-green-700 text-cream" : "bg-green-100 text-green-700"}`}>{brand.tier}</span>}
            </div>
            <p className="text-muted">{brand.companyName}</p>
          </div>
        </div>
        {(!brand.tier || brand.tier === "FREE") && (
          <div className="mt-5 p-4 bg-cream-elev rounded-2xl border border-line">
            <p className="text-sm font-semibold text-ink mb-1">이 브랜드의 본사이신가요?</p>
            <p className="text-xs text-muted">유료 플랜으로 등록하고 더 많은 노출과 관리 기능을 활용하세요</p>
            <button onClick={() => router.push("/pricing")} className="mt-2 text-xs text-terra-500 font-bold hover:text-terra-700">등록하고 관리하기 →</button>
          </div>
        )}
      </div>

      {/* Sticky 앵커 네비 */}
      <nav className="sticky top-14 z-30 -mx-4 px-4 bg-cream/92 backdrop-blur-md border-b border-line mb-6" aria-label="섹션 네비게이션">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2">
          {[
            { id: "info", label: "기본정보" },
            { id: "fees", label: "창업비용" },
            { id: "benefits", label: "창업특혜" },
            { id: "analysis", label: "업종분석" },
            ...(brand.managerId ? [{ id: "inquiry", label: "문의하기" }] : [{ id: "inquiry", label: "가맹 상담" }]),
          ].map((tab) => (
            <a
              key={tab.id}
              href={`#${tab.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(tab.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold text-muted hover:bg-cream-elev hover:text-green-700 transition-colors"
            >
              {tab.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="space-y-6 scroll-mt-32" style={{ scrollMarginTop: 120 }}>
        {/* ===== 기본정보 ===== */}
        <section id="info" className="bg-cream rounded-3xl border border-line overflow-hidden p-6 scroll-mt-32">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[11px] font-bold text-terra-500 tracking-[0.2em] uppercase">Info</span>
            <h2 className="text-xl md:text-2xl font-extrabold text-green-700 tracking-tight">기본 <span className="font-light text-terra-500">정보</span></h2>
          </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-gray-600">업종</span><p className="font-medium text-gray-900 mt-1">{brand.industry}</p></div>
                {brand.representativeName && <div><span className="text-sm text-gray-600">대표자</span><p className="font-medium text-gray-900 mt-1">{brand.representativeName}</p></div>}
                {brand.businessNumber && brand.businessNumber !== "" && <div><span className="text-sm text-gray-600">사업자등록번호</span><p className="font-medium text-gray-900 mt-1">{brand.businessNumber.replace(/(\d{3})(\d{2})(\d{5})/, "$1-$2-$3")}</p></div>}
                {brand.totalStores !== null && <div><span className="text-sm text-gray-600">전체 매장수</span><p className="font-medium text-gray-900 mt-1">{brand.totalStores.toLocaleString()}개</p></div>}
                {brand.avgRevenue !== null && <div><span className="text-sm text-gray-600">평균 매출</span><p className="font-medium text-gray-900 mt-1">월 {brand.avgRevenue.toLocaleString()}만원</p></div>}
                {brand.ftcRegisteredAt && <div><span className="text-sm text-gray-600">공정위 등록일</span><p className="font-medium text-gray-900 mt-1">{brand.ftcRegisteredAt}</p></div>}
                {brand.website && <div><span className="text-sm text-gray-600">웹사이트</span><a href={brand.website} target="_blank" rel="noopener noreferrer" className="font-medium text-green-700 hover:underline mt-1 block">{brand.website}</a></div>}
                {brand.representativePhone && <div><span className="text-sm text-gray-600">대표전화번호</span><a href={`tel:${brand.representativePhone}`} className="font-medium text-green-700 hover:underline mt-1 block">{brand.representativePhone}</a></div>}
                {brand.headquarterAddress && <div><span className="text-sm text-gray-600">본사 주소</span><p className="font-medium text-gray-900 mt-1">{brand.headquarterAddress}</p></div>}
                {brand.establishedDate && <div><span className="text-sm text-gray-600">설립일</span><p className="font-medium text-gray-900 mt-1">{brand.establishedDate}</p></div>}
                {brand.franchiseStartDate && <div><span className="text-sm text-gray-600">가맹사업 시작</span><p className="font-medium text-gray-900 mt-1">{brand.franchiseStartDate} <span className="inline-block px-2 py-0.5 ml-1 rounded-full text-xs font-medium bg-green-100 text-green-800">{new Date().getFullYear() - parseInt(brand.franchiseStartDate.match(/\d{4}/)?.[0] || '0')}년차</span></p></div>}
                {brand.contractPeriod && <div><span className="text-sm text-gray-600">계약기간</span><p className="font-medium text-gray-900 mt-1">{brand.contractPeriod}</p></div>}
                {brand.territoryProtection !== null && <div><span className="text-sm text-gray-600">영업지역 보호</span><p className="font-medium mt-1">{brand.territoryProtection ? <span className="text-green-600">O 보호</span> : <span className="text-red-600">X 미보호</span>}</p></div>}
                {brand.companyOwnedStores !== null && <div><span className="text-sm text-gray-600">직영점수</span><p className="font-medium text-gray-900 mt-1">{brand.companyOwnedStores.toLocaleString()}개</p></div>}
                {brand.majorProductName && <div><span className="text-sm text-gray-600">주요 상품</span><p className="font-medium text-gray-900 mt-1">{brand.majorProductName}</p></div>}
              </div>
              {brand.description && <div className="pt-4 border-t border-gray-200"><span className="text-sm text-gray-600">브랜드 소개</span><p className="text-gray-900 mt-2 whitespace-pre-wrap">{brand.description}</p></div>}
              {brand.financialSummary && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="font-medium text-gray-900">본사 재무현황 {brand.financialSummary.year && `(${brand.financialSummary.year}년)`}</h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {brand.financialSummary.revenue && (
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 mb-1">매출액</p>
                        <p className="text-lg font-bold text-green-700">{Number(brand.financialSummary.revenue).toLocaleString()}<span className="text-xs font-normal text-gray-500">천원</span></p>
                      </div>
                    )}
                    {brand.financialSummary.operatingProfit && (
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 mb-1">영업이익</p>
                        <p className="text-lg font-bold text-green-700">{Number(brand.financialSummary.operatingProfit).toLocaleString()}<span className="text-xs font-normal text-gray-500">천원</span></p>
                      </div>
                    )}
                    {brand.financialSummary.netProfit && (
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 mb-1">당기순이익</p>
                        <p className={`text-lg font-bold ${Number(brand.financialSummary.netProfit) >= 0 ? 'text-green-700' : 'text-red-600'}`}>{Number(brand.financialSummary.netProfit).toLocaleString()}<span className="text-xs font-normal text-gray-500">천원</span></p>
                      </div>
                    )}
                    {brand.financialSummary.totalAssets && (
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 mb-1">자산총계</p>
                        <p className="text-lg font-bold text-gray-700">{Number(brand.financialSummary.totalAssets).toLocaleString()}<span className="text-xs font-normal text-gray-500">천원</span></p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">* 공정거래위원회 정보공개서 기준 (단위: 천원)</p>
                </div>
              )}
              {brand.regionalStores && Object.keys(brand.regionalStores).length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="font-medium text-gray-900">지역별 가맹점 분포</h4>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {Object.entries(brand.regionalStores)
                      .filter(([_, count]) => count > 0)
                      .sort(([_, a], [__, b]) => b - a)
                      .map(([region, count]) => (
                        <div key={region} className="bg-cream-elev rounded-xl p-2 text-center">
                          <p className="text-xs text-gray-500">{region}</p>
                          <p className="text-sm font-bold text-gray-900">{count}<span className="text-xs font-normal text-gray-500">개</span></p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              {!!brand.ftcRawData && (
                <div className="pt-4 border-t border-gray-200 space-y-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3"><span className="text-lg">📊</span><h4 className="font-medium text-gray-900">공정위 공시 통계 ({brand.ftcRawData.year || '2024'}년)</h4></div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {brand.ftcRawData.newStores != null && (
                        <div className="bg-cream rounded-2xl p-3 text-center border border-green-200">
                          <p className="text-xs text-gray-500 mb-1">신규 가맹점</p>
                          <p className="text-lg font-bold text-green-700">{brand.ftcRawData.newStores.toLocaleString()}<span className="text-xs font-normal text-gray-500">개</span></p>
                        </div>
                      )}
                      {brand.ftcRawData.contractEnd != null && (
                        <div className="bg-cream rounded-2xl p-3 text-center border border-green-200">
                          <p className="text-xs text-gray-500 mb-1">계약 종료</p>
                          <p className="text-lg font-bold text-gray-700">{brand.ftcRawData.contractEnd.toLocaleString()}<span className="text-xs font-normal text-gray-500">건</span></p>
                        </div>
                      )}
                      {brand.ftcRawData.contractCancel != null && (
                        <div className="bg-cream rounded-2xl p-3 text-center border border-green-200">
                          <p className="text-xs text-gray-500 mb-1">계약 해지</p>
                          <p className="text-lg font-bold text-red-600">{brand.ftcRawData.contractCancel.toLocaleString()}<span className="text-xs font-normal text-gray-500">건</span></p>
                        </div>
                      )}
                      {brand.ftcRawData.revenuePerArea != null && brand.ftcRawData.revenuePerArea > 0 && (
                        <div className="bg-cream rounded-2xl p-3 text-center border border-green-200">
                          <p className="text-xs text-gray-500 mb-1">면적당 매출</p>
                          <p className="text-lg font-bold text-green-700">{Math.round(brand.ftcRawData.revenuePerArea / 1000).toLocaleString()}<span className="text-xs font-normal text-gray-500">만원</span></p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">* 공정거래위원회 가맹사업거래 정보공개서 기준</p>
                  </div>
                  {brand.ftcId && (
                    <a href={`https://franchise.ftc.go.kr/mnu/00013/program/userRqst/view.do?firMstSn=${brand.ftcId}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-green-700 hover:text-green-700 font-medium">공정위 정보공개서 원문 보기 →</a>
                  )}
                </div>
              )}
            </div>
        </section>

        {/* ===== 창업비용 ===== */}
        <section id="fees" className="bg-cream rounded-3xl border border-line overflow-hidden p-6 scroll-mt-32">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[11px] font-bold text-terra-500 tracking-[0.2em] uppercase">Fees</span>
            <h2 className="text-xl md:text-2xl font-extrabold text-green-700 tracking-tight">창업 <span className="font-light text-terra-500">비용</span></h2>
          </div>
            <div className="space-y-3 overflow-x-auto">
              {brand.franchiseFee !== null && <div className="flex justify-between py-3 border-b border-gray-100"><span className="text-gray-600 text-sm md:text-base">가맹비</span><span className="font-medium text-gray-900 text-sm md:text-base">{brand.franchiseFee.toLocaleString()}만원</span></div>}
              {brand.educationFee !== null && <div className="flex justify-between py-3 border-b border-gray-100"><span className="text-gray-600 text-sm md:text-base">교육비</span><span className="font-medium text-gray-900 text-sm md:text-base">{brand.educationFee.toLocaleString()}만원</span></div>}
              {brand.depositFee !== null && <div className="flex justify-between py-3 border-b border-gray-100"><span className="text-gray-600 text-sm md:text-base">보증금</span><span className="font-medium text-gray-900 text-sm md:text-base">{brand.depositFee.toLocaleString()}만원</span></div>}
              {brand.royalty !== null && <div className="flex justify-between py-3 border-b border-gray-100"><span className="text-gray-600 text-sm md:text-base">로열티</span><span className="font-medium text-gray-900 text-sm md:text-base">{brand.royalty}%</span></div>}
              {brand.interiorCost && <div className="flex justify-between py-3 border-b border-gray-100"><span className="text-gray-600 text-sm md:text-base">인테리어 비용</span><span className="font-medium text-gray-900 text-sm md:text-base">{brand.interiorCost}</span></div>}
              {brand.adPromotionFee && <div className="flex justify-between py-3 border-b border-gray-100"><span className="text-gray-600 text-sm md:text-base">광고판촉분담금</span><span className="font-medium text-gray-900 text-sm md:text-base">{brand.adPromotionFee}</span></div>}

              {(brand.tier === "SILVER" || brand.tier === "GOLD") && (brand.franchiseFee !== null || brand.educationFee !== null || brand.depositFee !== null) && (
                <div className="bg-gradient-to-br from-green-50 to-indigo-50 rounded-xl p-4 md:p-6 mt-6 border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">💰</span>
                    <h3 className="font-bold text-gray-900 text-base md:text-lg">창업 비용 계산기</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-700 text-white">{brand.tier === "GOLD" ? "골드" : "실버"} 전용</span>
                  </div>
                  <div className="space-y-2 mb-4">
                    {brand.franchiseFee !== null && <div className="flex justify-between text-sm"><span className="text-gray-600">가맹비</span><span className="text-gray-900">{brand.franchiseFee.toLocaleString()}만원</span></div>}
                    {brand.educationFee !== null && <div className="flex justify-between text-sm"><span className="text-gray-600">교육비</span><span className="text-gray-900">{brand.educationFee.toLocaleString()}만원</span></div>}
                    {brand.depositFee !== null && <div className="flex justify-between text-sm"><span className="text-gray-600">보증금</span><span className="text-gray-900">{brand.depositFee.toLocaleString()}만원</span></div>}
                  </div>
                  <div className="pt-3 border-t-2 border-green-300">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">총 초기 비용</span>
                      <span className="text-xl md:text-2xl font-bold text-green-700">
                        {((brand.franchiseFee || 0) + (brand.educationFee || 0) + (brand.depositFee || 0)).toLocaleString()}만원
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {brand.tier === "GOLD" && (
                <div className="bg-green-50 rounded-xl p-4 md:p-6 mt-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🗺️</span>
                    <h3 className="font-bold text-gray-900 text-base md:text-lg">가맹점 현황 지도</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-700 text-white">골드 전용</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">전국 가맹점 위치와 현황을 한눈에 확인하세요</p>
                  <div className="bg-cream rounded-2xl p-8 text-center border border-green-300">
                    <p className="text-gray-500 text-sm">골드 전용 기능: 가맹점 현황 지도는 준비 중입니다</p>
                  </div>
                </div>
              )}

              <div className="bg-green-50 rounded-lg p-3 md:p-4 mt-4"><p className="text-xs md:text-sm text-green-800">* 상기 비용은 예상 금액이며, 실제 창업 비용은 매장 규모 및 지역에 따라 달라질 수 있습니다.</p></div>
            </div>
        </section>

        {/* ===== 창업특혜 ===== */}
        <section id="benefits" className="bg-cream rounded-3xl border border-line overflow-hidden p-6 scroll-mt-32">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[11px] font-bold text-terra-500 tracking-[0.2em] uppercase">Benefits</span>
            <h2 className="text-xl md:text-2xl font-extrabold text-green-700 tracking-tight">창업 <span className="font-light text-terra-500">특혜</span></h2>
          </div>
          <div>{brand.benefits ? <div className="prose max-w-none"><p className="text-ink whitespace-pre-wrap">{brand.benefits}</p></div> : <div className="text-center py-12 text-muted"><p>등록된 창업특혜 정보가 없습니다</p></div>}</div>
        </section>

        {/* ===== 업종분석 ===== */}
        <section id="analysis" className="bg-cream rounded-3xl border border-line overflow-hidden p-6 scroll-mt-32">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[11px] font-bold text-terra-500 tracking-[0.2em] uppercase">Analysis</span>
            <h2 className="text-xl md:text-2xl font-extrabold text-green-700 tracking-tight">업종 <span className="font-light text-terra-500">분석</span></h2>
          </div>
          <IndustryRevenueSection industry={brand.industry} brandName={brand.brandName} brandAvgRevenue={brand.avgRevenue} />
        </section>

        {/* ===== 문의하기 / 가맹 상담 ===== */}
        <section id="inquiry" className="bg-cream rounded-3xl border border-line overflow-hidden p-6 scroll-mt-32">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[11px] font-bold text-terra-500 tracking-[0.2em] uppercase">{brand.managerId ? "Inquiry" : "Contact"}</span>
            <h2 className="text-xl md:text-2xl font-extrabold text-green-700 tracking-tight">{brand.managerId ? <>문의 <span className="font-light text-terra-500">하기</span></> : <>가맹 <span className="font-light text-terra-500">상담</span></>}</h2>
          </div>
          {brand.managerId ? (
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">이름</label><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 border border-line bg-cream-elev text-ink rounded-2xl focus:ring-2 focus:ring-green-700/20 focus:border-green-700 focus:bg-cream outline-none transition-all" placeholder="이름을 입력하세요" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">연락처</label><input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 border border-line bg-cream-elev text-ink rounded-2xl focus:ring-2 focus:ring-green-700/20 focus:border-green-700 focus:bg-cream outline-none transition-all" placeholder="010-0000-0000" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">문의내용</label><textarea required value={message} onChange={(e) => setMessage(e.target.value)} rows={6} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none" placeholder="문의하실 내용을 입력하세요" /></div>
                <button type="submit" disabled={submitting} className="w-full py-3.5 bg-green-700 text-cream rounded-full font-bold hover:bg-green-800 transition-colors disabled:bg-line-deep disabled:cursor-not-allowed">{submitting ? "전송 중..." : "문의하기"}</button>
              </form>
            ) : (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">아직 본사가 등록되지 않은 브랜드입니다</h3>
                <p className="text-sm text-gray-500 mb-1">이 브랜드는 공정위 정보공개서 기반으로 자동 등록된 브랜드로,</p>
                <p className="text-sm text-gray-500 mb-6">본사가 직접 관리하고 있지 않아 문의 접수가 불가합니다.</p>
                <div className="bg-green-50 rounded-xl p-5 max-w-md mx-auto border border-green-200">
                  <p className="text-sm font-medium text-green-900 mb-1">이 브랜드의 본사이신가요?</p>
                  <p className="text-xs text-green-700 mb-3">유료 플랜에 등록하시면 가맹 문의를 직접 받을 수 있습니다.</p>
                  <button onClick={() => router.push("/pricing?tab=FRANCHISE")} className="px-5 py-2.5 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">본사 등록하고 문의 받기</button>
                </div>
              </div>
            )}
        </section>
      </div>
      <StartupPartnerSection
        sameType={{ type: "franchise", id, title: "추천 프랜차이즈", viewAllLink: "/franchise" }}
        tabs={[
          { type: "partner", label: "협력업체", minTier: "PREMIUM" },
          { type: "equipment", label: "추천 집기", minTier: "PREMIUM" },
        ]}
      />
    </div>
  );
}
