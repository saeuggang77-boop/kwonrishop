"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, FileEdit, Eye, BarChart3, ShieldCheck, ClipboardList,
  MessageCircle, Search, Phone, Mail, Clock,
  ChevronDown, ChevronRight, Home, User, Users, Calculator,
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
  const [footerOpen, setFooterOpen] = useState<string | null>(null);
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
        <section className="border-t border-gray-200 bg-white py-10 md:py-16">
          <div className="mx-auto max-w-[1200px] px-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-base font-bold text-navy md:text-xl">인기 프랜차이즈</h2>
              <Link href="/franchise" className="flex items-center text-xs text-gray-500 transition-colors hover:text-navy md:text-sm">
                전체보기 <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-3 flex gap-2">
              {[
                { key: "all", label: "전체" },
                { key: "외식", label: "외식" },
                { key: "도소매", label: "도소매" },
                { key: "서비스", label: "서비스" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFranTab(tab.key)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    franTab === tab.key
                      ? "bg-navy text-white"
                      : "border border-gray-200 text-gray-600 hover:border-navy hover:text-navy"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loadingFranchise ? (
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-44 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
                ))}
              </div>
            ) : franchises.length === 0 ? (
              <p className="mt-6 py-8 text-center text-sm text-gray-400">프랜차이즈 정보가 없습니다</p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
                {franchises.map((brand) => (
                  <Link
                    key={brand.id}
                    href={`/franchise/${brand.id}`}
                    className="group rounded-xl border border-gray-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${AVATAR_COLORS[brand.subcategory] ?? "bg-navy text-white"}`}>
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
          <section className="border-t border-gray-200 bg-gray-50 py-8 md:py-12">
            <div className="mx-auto max-w-[1200px] px-4">
              <div className="grid gap-6 md:grid-cols-2">
                {/* 공지사항 */}
                {notices.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <Megaphone className="h-4 w-4 text-navy" />
                        <h2 className="text-sm font-bold text-navy md:text-base">공지사항</h2>
                      </div>
                      <Link href="/bbs?category=공지사항" className="text-xs text-gray-400 hover:text-navy">
                        더보기 <ChevronRight className="inline h-3 w-3" />
                      </Link>
                    </div>
                    <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
                      {notices.map((n) => (
                        <Link
                          key={n.id}
                          href={`/bbs/${n.id}`}
                          className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50"
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
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4 text-navy" />
                        <h2 className="text-sm font-bold text-navy md:text-base">이용가이드</h2>
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
                          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50"
                        >
                          {g.thumbnailUrl ? (
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                              <Image src={g.thumbnailUrl} alt={g.title} fill className="object-cover" sizes="56px" />
                            </div>
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-navy/5">
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
          <section className="border-t border-gray-200 bg-white py-8 md:py-12">
            <div className="mx-auto max-w-[1200px] px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Lightbulb className="h-4 w-4 text-amber-500 md:h-5 md:w-5" />
                  <h2 className="font-heading text-base font-bold text-navy md:text-xl">창업정보</h2>
                </div>
                <Link href="/bbs?category=창업정보" className="flex items-center text-xs text-gray-500 transition-colors hover:text-navy md:text-sm">
                  전체보기 <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {startupTips.map((tip) => (
                  <Link
                    key={tip.id}
                    href={`/bbs/${tip.id}`}
                    className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    {tip.thumbnailUrl ? (
                      <div className="relative h-32 bg-gray-100">
                        <Image src={tip.thumbnailUrl} alt={tip.title} fill className="object-cover" sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw" />
                      </div>
                    ) : (
                      <div className="flex h-32 items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
                        <Lightbulb className="h-8 w-8 text-amber-300" />
                      </div>
                    )}
                    <div className="p-3.5">
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
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1e3a5f] via-[#1e40af] to-[#3b82f6] py-12 md:py-20">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px,white 1px,transparent 0)", backgroundSize: "20px 20px" }} />
          <div className="relative mx-auto max-w-7xl px-4">
            <div className="md:flex md:items-center md:gap-12">
              <div className="flex-1 text-center md:text-left">
                <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white">권리진단서</span>
                <h2 className="mt-3 font-heading text-xl font-bold text-white md:text-3xl">내 가게 권리금,<br />적정한가요?</h2>
                <p className="mt-2 text-xs text-white/70 md:text-sm">권리진단서로 안전한 거래를 시작하세요</p>
              </div>
              <div className="mt-6 space-y-3 md:mt-0 md:flex md:flex-1 md:gap-4 md:space-y-0">
                {[
                  { icon: BarChart3, title: "권리금 적정성 평가", desc: "주변 시세 대비 AI 분석" },
                  { icon: ShieldCheck, title: "위험요소 분석", desc: "임대차·건물·상권 점검" },
                  { icon: ClipboardList, title: "임대차 체크리스트", desc: "거래 전 필수 확인 항목" },
                ].map(c => (
                  <div key={c.title} className="flex items-start gap-3 rounded-xl bg-white/10 p-4 backdrop-blur-sm transition-all duration-200 md:flex-1 md:flex-col md:items-start md:gap-0 md:p-5 md:hover:bg-white/15">
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
              <Link href="/reports/sample" className="flex min-h-[48px] w-full max-w-sm items-center justify-center gap-2 rounded-full bg-white text-sm font-bold text-[#1e40af] shadow-lg transition-all duration-200 active:scale-95 md:w-auto md:px-10 md:hover:scale-105 md:hover:shadow-xl">
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
        <section className="bg-[#F8F9FA] py-12 md:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="relative overflow-hidden rounded-2xl bg-navy p-8 text-center md:p-12">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px,white 1px,transparent 0)", backgroundSize: "32px 32px" }} />
              <div className="relative">
                <h2 className="font-heading text-lg font-bold text-white md:text-2xl">지금 시작하세요</h2>
                <p className="mt-2 text-sm text-gray-300">무료 매물 등록부터 전문가 상담까지, 권리샵이 함께합니다.</p>
                <div className="mt-6 flex flex-col gap-3 md:flex-row md:justify-center md:gap-4">
                  <Link href="/listings" className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-white/30 px-8 font-medium text-white transition-all duration-200 active:scale-[0.97] md:hover:bg-white/10">
                    <Search className="h-4 w-4" /> 매물 찾기
                  </Link>
                  <Link href="/listings/new" className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-accent px-8 font-medium text-white shadow-lg transition-all duration-200 active:scale-[0.97] hover:bg-accent-dark hover:shadow-xl">
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
        className={`fixed bottom-14 left-0 right-0 z-40 px-4 transition-all duration-300 md:hidden ${showFloating ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"}`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex gap-2 rounded-xl bg-white/95 p-2 shadow-xl backdrop-blur-md border border-gray-200">
          <Link href="/listings/new" className="flex flex-1 min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-accent text-sm font-bold text-white active:scale-95 hover:bg-accent-dark">
            <FileEdit className="h-4 w-4" /> 매물 등록
          </Link>
          <Link href="/experts" className="flex flex-1 min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-navy text-sm font-bold text-white active:scale-95">
            <MessageCircle className="h-4 w-4" /> 무료 상담
          </Link>
        </div>
      </div>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-gray-200 bg-[#111827] text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
          {/* Desktop: 4-column grid */}
          <div className="grid gap-8 md:grid-cols-4">
            {/* Column 1: Logo + Business Info */}
            <div>
              <Link href="/" className="flex items-center gap-1.5">
                <Image src="/logos/krw_shop_logo_symbol_transparent.png" alt="권리샵" width={24} height={24} />
                <span className="font-heading text-sm font-bold text-white">권리샵</span>
              </Link>
              <div className="mt-4 space-y-1 text-xs text-white/50">
                <p>대표: 박상만</p>
                <p>사업자등록번호: 408-70-43230</p>
                <p>서울특별시 동작구 장승배기로4길 9</p>
              </div>
            </div>

            {/* Column 2: 서비스 */}
            <div className="hidden md:block">
              <h3 className="text-sm font-bold text-white/90">서비스</h3>
              <ul className="mt-3 space-y-2">
                <li><Link href="/listings" className="text-sm text-white/50 transition-colors hover:text-white/80">점포 찾기</Link></li>
                <li><Link href="/listings/new" className="text-sm text-white/50 transition-colors hover:text-white/80">점포 팔기</Link></li>
                <li><Link href="/franchise" className="text-sm text-white/50 transition-colors hover:text-white/80">프랜차이즈</Link></li>
                <li><Link href="/reports/request" className="text-sm text-white/50 transition-colors hover:text-white/80">권리진단서</Link></li>
              </ul>
            </div>

            {/* Column 3: 고객지원 */}
            <div className="hidden md:block">
              <h3 className="text-sm font-bold text-white/90">고객지원</h3>
              <ul className="mt-3 space-y-2">
                <li><Link href="/bbs" className="text-sm text-white/50 transition-colors hover:text-white/80">이용가이드</Link></li>
                <li><Link href="/pricing" className="text-sm text-white/50 transition-colors hover:text-white/80">서비스 요금</Link></li>
                <li><Link href="/legal/terms" className="text-sm text-white/50 transition-colors hover:text-white/80">이용약관</Link></li>
                <li><Link href="/legal/privacy" className="text-sm text-white/50 transition-colors hover:text-white/80">개인정보처리방침</Link></li>
              </ul>
            </div>

            {/* Column 4: 고객센터 */}
            <div>
              <h3 className="text-sm font-bold text-white/90">고객센터</h3>
              <div className="mt-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-accent" />
                  <span className="text-lg font-bold text-white">1588-7928</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>평일 09:00 ~ 18:00 (주말/공휴일 휴무)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span>samsungcu@naver.com</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: accordion links */}
          <div className="mt-6 space-y-0 md:hidden">
            {[
              { title: "서비스", links: [{ label: "점포 찾기", href: "/listings" }, { label: "점포 팔기", href: "/listings/new" }, { label: "프랜차이즈", href: "/franchise" }, { label: "권리진단서", href: "/reports/request" }] },
              { title: "고객지원", links: [{ label: "이용가이드", href: "/bbs" }, { label: "서비스 요금", href: "/pricing" }, { label: "이용약관", href: "/legal/terms" }, { label: "개인정보처리방침", href: "/legal/privacy" }] },
            ].map(group => (
              <div key={group.title} className="border-b border-white/10">
                <button onClick={() => setFooterOpen(footerOpen === group.title ? null : group.title)}
                  className="flex min-h-[44px] w-full items-center justify-between py-3 text-sm font-medium text-white/70">
                  {group.title}
                  <ChevronDown className={`h-4 w-4 text-white/30 transition-transform ${footerOpen === group.title ? "rotate-180" : ""}`} />
                </button>
                {footerOpen === group.title && (
                  <div className="space-y-2 pb-3 pl-2">
                    {group.links.map(l => <Link key={l.href} href={l.href} className="block text-sm text-white/40 hover:text-white/70">{l.label}</Link>)}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom: divider + disclaimer + copyright */}
          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="text-center text-[10px] text-white/30 md:text-left md:text-xs">
              본 서비스에서 제공하는 정보는 참고용이며, 플랫폼은 매물의 정확성을 보증하지 않습니다.
            </p>
            <p className="mt-2 text-center text-[10px] text-white/30 md:text-left md:text-xs">
              &copy; 2026 권리샵. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* ═══ Mobile Bottom Tab Bar ═══ */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-gray-200 bg-white/95 backdrop-blur-sm md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {[
          { href: "/", icon: Home, label: "홈", active: true },
          { href: "/listings", icon: Search, label: "매물", active: false },
          { href: "/simulator", icon: Calculator, label: "시뮬레이터", active: false },
          { href: "/experts", icon: Users, label: "전문가", active: false },
          { href: "/dashboard", icon: User, label: "마이", active: false },
        ].map(t => (
          <Link key={t.href} href={t.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] ${t.active ? "text-navy" : "text-gray-500"}`}
            {...(t.active ? { "aria-current": "page" as const } : {})}>
            <t.icon className="h-5 w-5" />
            {t.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
