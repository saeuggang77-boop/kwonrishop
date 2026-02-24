"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, FileEdit, Eye, BarChart3, ShieldCheck, ClipboardList,
  MessageCircle, ChevronRight,
  Megaphone, BookOpen, Lightbulb,
} from "lucide-react";
import { RevealOnScroll } from "@/components/ui/reveal-on-scroll";

/* ─── Franchise helpers ─── */
interface FranchiseBrand {
  id: string;
  brandName: string;
  category: string;
  subcategory: string;
  monthlyAvgSales: string | null;
  startupCost: string | null;
  storeCount: number | null;
}

interface BoardPostItem {
  id: string;
  category: string;
  title: string;
  content: string;
  thumbnailUrl: string | null;
  viewCount: number;
  createdAt: string;
}

const AVATAR_COLORS: Record<string, string> = {
  커피: "bg-amber-800 text-amber-100",
  치킨: "bg-orange-600 text-orange-100",
  한식: "bg-red-700 text-red-100",
  양식: "bg-rose-700 text-rose-100",
  피자: "bg-yellow-600 text-yellow-100",
  분식: "bg-pink-600 text-pink-100",
  패스트푸드: "bg-orange-500 text-orange-100",
  편의점: "bg-blue-700 text-blue-100",
  세탁: "bg-purple-600 text-purple-100",
};

function formatKRW(amount: number): string {
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억`;
  if (amount >= 10000) return `${Math.round(amount / 10000).toLocaleString()}만`;
  return amount.toLocaleString();
}

export default function HomeBelowFold() {
  const [showFloating, setShowFloating] = useState(false);
  const [franchises, setFranchises] = useState<FranchiseBrand[]>([]);
  const [loadingFranchise, setLoadingFranchise] = useState(true);
  const [notices, setNotices] = useState<BoardPostItem[]>([]);
  const [guides, setGuides] = useState<BoardPostItem[]>([]);
  const [startupTips, setStartupTips] = useState<BoardPostItem[]>([]);
  const [franTab, setFranTab] = useState<string>("all");

  useEffect(() => {
    const onScroll = () => setShowFloating(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setLoadingFranchise(true);
    const params = new URLSearchParams({ limit: "6", sortBy: "monthlyAvgSales" });
    if (franTab !== "all") params.set("category", franTab);
    fetch(`/api/franchise?${params}`)
      .then(r => r.json())
      .then(json => setFranchises(json.data ?? []))
      .catch(() => setFranchises([]))
      .finally(() => setLoadingFranchise(false));
  }, [franTab]);

  useEffect(() => {
    Promise.all([
      fetch("/api/bbs?category=공지사항&limit=5").then(r => r.json()).catch(() => ({ data: [] })),
      fetch("/api/bbs?category=이용가이드&limit=3").then(r => r.json()).catch(() => ({ data: [] })),
      fetch("/api/bbs?category=창업정보&limit=4").then(r => r.json()).catch(() => ({ data: [] })),
    ]).then(([noticeRes, guideRes, tipsRes]) => {
      setNotices(noticeRes.data ?? []);
      setGuides(guideRes.data ?? []);
      setStartupTips(tipsRes.data ?? []);
    });
  }, []);

  return (
    <>
      {/* ═══ 4.5 Popular Franchises ═══ */}
      <RevealOnScroll>
        <section className="bg-white py-12 md:py-20">
          <div className="mx-auto max-w-[1200px] px-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold text-navy md:text-2xl">인기 프랜차이즈</h2>
              <Link href="/franchise" className="flex items-center text-xs text-gray-500 transition-colors hover:text-navy md:text-sm">
                전체보기 <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 flex gap-2">
              {[
                { key: "all", label: "전체" },
                { key: "외식", label: "외식" },
                { key: "도소매", label: "도소매" },
                { key: "서비스", label: "서비스" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFranTab(tab.key)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    franTab === tab.key
                      ? "bg-navy text-white shadow-sm"
                      : "border border-gray-200 bg-white text-gray-600 hover:border-navy hover:text-navy"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loadingFranchise ? (
              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-44 animate-pulse rounded-2xl bg-gray-100" />
                ))}
              </div>
            ) : franchises.length === 0 ? (
              <p className="mt-6 py-8 text-center text-sm text-gray-400">프랜차이즈 정보가 없습니다</p>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
                {franchises.map((brand) => (
                  <Link
                    key={brand.id}
                    href={`/franchise/${brand.id}`}
                    className="card-hover group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-navy/20 hover:shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold ${AVATAR_COLORS[brand.subcategory] ?? "bg-navy text-white"}`}>
                        {brand.brandName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600">
                          {brand.subcategory}
                        </span>
                        <h3 className="mt-1 truncate text-sm font-bold text-navy group-hover:text-navy/80">
                          {brand.brandName}
                        </h3>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1.5 text-xs">
                      {brand.monthlyAvgSales && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">월 평균매출</span>
                          <span className="font-bold text-navy">{formatKRW(Number(brand.monthlyAvgSales))}</span>
                        </div>
                      )}
                      {brand.startupCost && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">창업비용</span>
                          <span className="font-bold text-navy">{formatKRW(Number(brand.startupCost))}</span>
                        </div>
                      )}
                      {brand.storeCount != null && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">가맹점</span>
                          <span className="font-bold text-navy">{brand.storeCount.toLocaleString()}개</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </RevealOnScroll>

      {/* ═══ 공지 & 가이드 ═══ */}
      {(notices.length > 0 || guides.length > 0) && (
        <RevealOnScroll>
          <section className="bg-surface-1 py-12 md:py-16">
            <div className="mx-auto max-w-[1200px] px-4">
              <div className="grid gap-6 md:grid-cols-2">
                {/* 공지사항 */}
                {notices.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1.5">
                        <Megaphone className="h-4 w-4 text-navy" />
                        <h2 className="font-heading text-base font-bold text-navy md:text-lg">공지사항</h2>
                      </div>
                      <Link href="/bbs?category=공지사항" className="text-xs text-gray-400 hover:text-navy">
                        더보기 <ChevronRight className="inline h-3 w-3" />
                      </Link>
                    </div>
                    <div className="divide-y divide-gray-200 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                      {notices.map((n) => (
                        <Link
                          key={n.id}
                          href={`/bbs/${n.id}`}
                          className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-navy-50/50"
                        >
                          <span className="truncate text-sm text-gray-700">{n.title}</span>
                          <span className="ml-3 flex-none text-[11px] text-gray-400">
                            {new Date(n.createdAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 이용가이드 */}
                {guides.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4 text-navy" />
                        <h2 className="font-heading text-base font-bold text-navy md:text-lg">이용가이드</h2>
                      </div>
                      <Link href="/bbs?category=이용가이드" className="text-xs text-gray-400 hover:text-navy">
                        더보기 <ChevronRight className="inline h-3 w-3" />
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {guides.map((g) => (
                        <Link
                          key={g.id}
                          href={`/bbs/${g.id}`}
                          className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:bg-gray-50"
                        >
                          {g.thumbnailUrl ? (
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                              <Image src={g.thumbnailUrl} alt={g.title} fill className="object-cover" sizes="56px" />
                            </div>
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-navy/5">
                              <BookOpen className="h-5 w-5 text-navy/30" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-bold text-gray-800">{g.title}</h3>
                            <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{g.content.replace(/<[^>]*>/g, "").slice(0, 60)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </RevealOnScroll>
      )}

      {/* ═══ 창업정보 ═══ */}
      {startupTips.length > 0 && (
        <RevealOnScroll>
          <section className="bg-white py-12 md:py-20">
            <div className="mx-auto max-w-[1200px] px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Lightbulb className="h-4 w-4 text-amber-500 md:h-5 md:w-5" />
                  <h2 className="font-heading text-lg font-bold text-navy md:text-2xl">창업정보</h2>
                </div>
                <Link href="/bbs?category=창업정보" className="flex items-center text-xs text-gray-500 transition-colors hover:text-navy md:text-sm">
                  전체보기 <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {startupTips.map((tip) => (
                  <Link
                    key={tip.id}
                    href={`/bbs/${tip.id}`}
                    className="card-hover group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-lg"
                  >
                    {tip.thumbnailUrl ? (
                      <div className="relative h-36 bg-gray-100">
                        <Image src={tip.thumbnailUrl} alt={tip.title} fill className="object-cover" sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw" />
                      </div>
                    ) : (
                      <div className="flex h-36 items-center justify-center bg-gradient-to-br from-navy-50 to-navy-100">
                        <Lightbulb className="h-8 w-8 text-navy/30" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-navy">{tip.title}</h3>
                      <p className="mt-1.5 text-xs text-gray-500 line-clamp-2">{tip.content.replace(/<[^>]*>/g, "").slice(0, 80)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </RevealOnScroll>
      )}

      {/* ═══ 5. Report Promo ═══ */}
      <RevealOnScroll>
        <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy-dark to-navy-900 py-16 md:py-24">
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 1px 1px,white 1px,transparent 0)", backgroundSize: "20px 20px" }} />
          <div className="relative mx-auto max-w-7xl px-4">
            <div className="md:flex md:items-center md:gap-12">
              <div className="flex-1 text-center md:text-left">
                <span className="inline-block rounded-full bg-accent/20 px-3 py-1 text-[11px] font-bold text-accent-light">권리진단서</span>
                <h2 className="mt-3 font-heading text-2xl font-bold text-white md:text-4xl">내 가게 권리금,<br />적정한가요?</h2>
                <p className="mt-2 text-xs text-white/70 md:text-sm">권리진단서로 안전한 거래를 시작하세요</p>
              </div>
              <div className="mt-6 space-y-3 md:mt-0 md:flex md:flex-1 md:gap-4 md:space-y-0">
                {[
                  { icon: BarChart3, title: "권리금 적정성 평가", desc: "주변 시세 대비 AI 분석" },
                  { icon: ShieldCheck, title: "위험요소 분석", desc: "임대차·건물·상권 점검" },
                  { icon: ClipboardList, title: "임대차 체크리스트", desc: "거래 전 필수 확인 항목" },
                ].map(c => (
                  <div key={c.title} className="flex items-start gap-3 rounded-2xl bg-white/10 p-5 backdrop-blur-sm transition-all duration-200 hover:bg-white/15 md:flex-1 md:flex-col md:items-start md:gap-0">
                    <c.icon className="h-6 w-6 shrink-0 text-white md:h-7 md:w-7" />
                    <div className="md:mt-3">
                      <h3 className="text-sm font-bold text-white">{c.title}</h3>
                      <p className="mt-0.5 text-xs text-white/60">{c.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 flex flex-col items-center gap-3 md:flex-row md:justify-start">
              <Link href="/reports/sample" className="flex min-h-[48px] w-full max-w-sm items-center justify-center gap-2 rounded-full bg-white text-sm font-bold text-navy shadow-xl transition-all duration-200 active:scale-95 md:w-auto md:px-10 md:hover:shadow-2xl">
                <Eye className="h-4 w-4" /> 샘플 미리보기
              </Link>
              <Link href="/reports/request" className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-medium text-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:text-white active:scale-95">
                권리진단서 발급받기 <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* ═══ 8. CTA ═══ */}
      <RevealOnScroll>
        <section className="bg-surface-1 py-12 md:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="relative overflow-hidden rounded-3xl bg-navy p-10 text-center md:p-14">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px,white 1px,transparent 0)", backgroundSize: "32px 32px" }} />
              <div className="relative">
                <h2 className="font-heading text-xl font-bold text-white md:text-3xl">지금 시작하세요</h2>
                <p className="mt-2 text-sm text-white/60">무료 매물 등록부터 전문가 상담까지, 권리샵이 함께합니다.</p>
                <div className="mt-6 flex flex-col gap-3 md:flex-row md:justify-center md:gap-4">
                  <Link href="/listings" className="flex min-h-[48px] items-center justify-center gap-2 rounded-full border-2 border-white/30 px-8 font-medium text-white transition-all duration-200 active:scale-[0.97] md:hover:bg-white/10">
                    매물 찾기
                  </Link>
                  <Link href="/listings/new" className="flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-accent px-8 font-medium text-white shadow-lg transition-all duration-200 active:scale-[0.97] hover:bg-accent-dark hover:shadow-xl">
                    <FileEdit className="h-4 w-4" /> 내 점포 무료 등록하기
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* ═══ Mobile Floating CTA ═══ */}
      <div
        className={`fixed bottom-20 left-0 right-0 z-40 px-4 transition-all duration-300 md:hidden ${showFloating ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"}`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex gap-2 rounded-2xl bg-white/95 p-2.5 shadow-2xl backdrop-blur-md border border-gray-100">
          <Link href="/listings/new" className="flex flex-1 min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-accent text-sm font-bold text-white active:scale-95 hover:bg-accent-dark">
            <FileEdit className="h-4 w-4" /> 매물 등록
          </Link>
          <Link href="/experts" className="flex flex-1 min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-navy text-sm font-bold text-white active:scale-95">
            <MessageCircle className="h-4 w-4" /> 무료 상담
          </Link>
        </div>
      </div>
    </>
  );
}
