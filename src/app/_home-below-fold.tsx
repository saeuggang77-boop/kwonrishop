"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, FileEdit, Eye, BarChart3, ShieldCheck, ClipboardList,
  Receipt, Target, MessageCircle, Search, Phone, Mail, Clock,
  ChevronDown, Home, User, Users, Calculator,
} from "lucide-react";
import { RevealOnScroll } from "@/components/ui/reveal-on-scroll";

export default function HomeBelowFold() {
  const [showFloating, setShowFloating] = useState(false);
  const [footerOpen, setFooterOpen] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setShowFloating(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
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

      {/* ═══ 5.5 Mid-page CTA ═══ */}
      <section className="bg-[#EBF5FF] py-6 md:py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 md:flex-row md:justify-between">
          <p className="text-sm font-bold text-navy md:text-base">내 점포도 무료로 등록해보세요</p>
          <Link href="/listings/new" className="flex min-h-[40px] items-center gap-2 rounded-lg bg-navy px-6 text-sm font-bold text-white transition-all duration-200 active:scale-95 md:hover:bg-navy-dark">
            점포 등록하기 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ═══ 6. Simulator Promo ═══ */}
      <RevealOnScroll>
        <section className="bg-[#F8F9FA] py-12 md:py-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="overflow-hidden rounded-2xl bg-white shadow-md md:flex">
              <div className="p-6 md:flex-1 md:p-10">
                <h2 className="font-heading text-lg font-bold text-navy md:text-2xl">창업 수익성을 미리 계산해보세요</h2>
                <p className="mt-2 text-xs text-gray-500 md:text-sm">업종별 예상 수익과 초기 투자비를 분석하세요.</p>
                <div className="mt-5 space-y-3 md:mt-6 md:space-y-4">
                  {[
                    { icon: BarChart3, label: "초기투자 분석", desc: "보증금, 권리금, 인테리어 등 총 창업비용" },
                    { icon: Receipt, label: "월 손익 시뮬레이션", desc: "매출 데이터 기반 월별 손익 추이" },
                    { icon: Target, label: "투자금 회수기간", desc: "투자 원금 회수 시점 예측" },
                  ].map(f => (
                    <div key={f.label} className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy/10 md:h-10 md:w-10">
                        <f.icon className="h-4 w-4 text-navy md:h-5 md:w-5" />
                      </div>
                      <div>
                        <h3 className="text-[13px] font-bold text-navy md:text-sm">{f.label}</h3>
                        <p className="text-[11px] text-gray-500 md:text-xs">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Mobile: summary cards + mini chart */}
                <div className="mt-6 space-y-3 md:hidden">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-navy/5 p-2.5 text-center">
                      <p className="text-[9px] text-gray-500">총 투자금</p>
                      <p className="text-sm font-bold text-navy">1.2억</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-2.5 text-center">
                      <p className="text-[9px] text-gray-500">예상 월순이익</p>
                      <p className="text-sm font-bold text-accent-dark">850만</p>
                    </div>
                    <div className="rounded-lg bg-navy/5 p-2.5 text-center">
                      <p className="text-[9px] text-gray-500">회수기간</p>
                      <p className="text-sm font-bold text-navy">14개월</p>
                    </div>
                  </div>
                  <div className="flex items-end justify-center gap-2">
                    {[50, 70, 40, 60, 80].map((h, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div className="w-7 rounded-t bg-gradient-to-t from-navy to-navy/50" style={{ height: `${h}px` }} />
                        <span className="text-[9px] text-gray-400">{["1월", "2월", "3월", "4월", "5월"][i]}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-center text-[9px] text-gray-400">* 실제 결과는 입력 조건에 따라 달라집니다</p>
                </div>
                <Link href="/simulator"
                  className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-accent font-medium text-white shadow-lg transition-all duration-200 active:scale-[0.97] hover:bg-accent-dark hover:shadow-xl md:mt-8 md:w-auto md:px-8">
                  시뮬레이터 시작하기 <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              {/* Desktop: Simulator Preview */}
              <div className="hidden flex-col items-center justify-center gap-6 bg-gradient-to-br from-[#E8F0FE] to-[#DBEAFE] p-6 md:flex md:w-[320px] lg:w-[400px] lg:p-10">
                <div className="w-full rounded-xl bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">📌 카페 창업 예시</span>
                  </div>
                  <p className="mt-1.5 text-xs font-medium text-gray-400">시뮬레이션 결과 미리보기</p>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-[#E8F0FE] p-3 text-center">
                      <p className="text-[10px] text-gray-500">총 투자금</p>
                      <p className="mt-1 text-lg font-bold text-navy">1.2억</p>
                    </div>
                    <div className="rounded-lg bg-[#FEF3C7] p-3 text-center">
                      <p className="text-[10px] text-gray-500">예상 월순이익</p>
                      <p className="mt-1 text-lg font-bold text-accent-dark">850만</p>
                    </div>
                    <div className="rounded-lg bg-[#E8F0FE] p-3 text-center">
                      <p className="text-[10px] text-gray-500">회수기간</p>
                      <p className="mt-1 text-lg font-bold text-navy">14개월</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-1.5">
                    {[40, 55, 35, 65, 50, 75, 60].map((h, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1">
                        <div className="w-full rounded-t bg-gradient-to-t from-navy to-[#3B82F6]" style={{ height: `${h}px` }} />
                        <span className="text-[8px] text-gray-400">{["1월", "2월", "3월", "4월", "5월", "6월", "7월"][i]}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-center text-[9px] text-gray-400">* 실제 결과는 입력 조건에 따라 달라집니다</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* ═══ 7. Free for Buyers ═══ */}
      <RevealOnScroll>
        <section className="border-t border-gray-200 bg-white py-12 md:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-center font-heading text-lg font-bold text-navy md:text-2xl">매수자는 모든 매물 정보를 무료로 열람할 수 있습니다</h2>

            <div className="mx-auto mt-8 grid gap-4 md:mt-10 md:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-center transition-all duration-200 md:hover:-translate-y-1 md:hover:shadow-lg">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-navy/10">
                  <Search className="h-6 w-6 text-navy" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-navy">매물 검색 무료</h3>
                <p className="mt-1.5 text-xs text-gray-500">전국 상가 매물을 자유롭게 검색하세요</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-center transition-all duration-200 md:hover:-translate-y-1 md:hover:shadow-lg">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-navy/10">
                  <BarChart3 className="h-6 w-6 text-navy" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-navy">시세 분석 무료</h3>
                <p className="mt-1.5 text-xs text-gray-500">권리금·월매출 데이터를 확인하세요</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-center transition-all duration-200 md:hover:-translate-y-1 md:hover:shadow-lg">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-navy/10">
                  <ClipboardList className="h-6 w-6 text-navy" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-navy">권리진단서 1건 무료</h3>
                <p className="mt-1.5 text-xs text-gray-500">첫 거래는 무료 진단서로 안전하게</p>
              </div>
            </div>

            <div className="mt-5 text-center md:mt-8">
              <Link href="/pricing" className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 transition-colors hover:text-navy hover:underline md:text-sm">매도자·광고주 요금은 자세히 보기 <ArrowRight className="h-3.5 w-3.5" /></Link>
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
