"use client";

import Link from "next/link";

// 1-A. 매물 목록 인피드 프로모션 카드 (컴팩트)
export function ListingInfeedPromo() {
  return (
    <div className="relative rounded-lg border border-dashed border-gray-300 bg-gray-50/60 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="mb-0.5 text-sm font-bold text-gray-900 leading-snug">
            내 매물, 더 빨리 팔고 싶다면?
          </h3>
          <p className="text-xs text-gray-500">
            프리미엄 사장님의 평균 문의량 <span className="font-semibold text-green-700">3배 ↑</span>
          </p>
        </div>
        <Link
          href="/pricing?tab=listing"
          className="shrink-0 rounded-md bg-green-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-800"
        >
          요금제 보기 →
        </Link>
      </div>
    </div>
  );
}

// 1-B. 매물 상세 업셀 배너
export function ListingUpsellBanner({
  currentPlan,
  categoryName,
}: {
  currentPlan?: string;
  categoryName?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-green-300 bg-green-50 p-6 md:flex-row">
      {/* 이모지 */}
      <div className="text-5xl">🚀</div>

      {/* 중앙 텍스트 */}
      <div className="flex-1 text-center md:text-left">
        <h3 className="mb-1 text-lg font-bold text-gray-900">
          이 매물의 노출을 극대화하세요
        </h3>
        <p className="text-sm text-gray-700">
          프리미엄 전환 시 상위 노출 + 하이라이트 배지 + 끌어올리기 5회 제공
        </p>
        {currentPlan && (
          <p className="mt-1 text-xs text-gray-600">
            현재 플랜: {currentPlan}
          </p>
        )}
      </div>

      {/* CTA 버튼 */}
      <Link
        href="/pricing?tab=listing"
        className="whitespace-nowrap rounded-lg bg-green-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
      >
        업그레이드
      </Link>
    </div>
  );
}

// 1-C. 프랜차이즈/협력업체/장비 등록 유도
export function RegisterPromoBanner({
  type,
}: {
  type: "listing" | "franchise" | "partner" | "equipment";
}) {
  const config = {
    listing: {
      bg: "from-green-50 to-green-100",
      border: "border-green-300",
      title: "내 매물, 더 빨리 팔고 싶다면?",
      subtitle: "프리미엄 사장님의 평균 문의량 3배, 매각 속도 2배 빠릅니다",
      badges: ["상위노출", "인증배지", "끌어올리기"],
      badgeColor: "bg-green-700",
      cta: "월 10만원부터 · 요금제 비교하기 →",
      link: "/pricing?tab=listing",
    },
    franchise: {
      bg: "from-green-50 to-green-100",
      border: "border-green-400",
      title: "내 프랜차이즈 브랜드를 권리샵에 등록하세요",
      subtitle: "예비 창업자 월 12,000명이 검색합니다",
      badges: ["브랜드 상세", "가맹문의", "상위노출"],
      badgeColor: "bg-green-500",
      cta: "월 30만원부터 · 요금제 비교하기 →",
      link: "/pricing?tab=franchise",
    },
    partner: {
      bg: "from-green-50 to-green-100",
      border: "border-green-400",
      title: "상가 창업에 필요한 전문 서비스를 제공하시나요?",
      subtitle: "인테리어, 설비, 법무, 세무, 간판 등 사장님들이 찾는 서비스를 직접 연결합니다",
      badges: ["업체프로필", "매물상세연동", "상위노출"],
      badgeColor: "bg-green-500",
      cta: "월 10만원부터 · 요금제 비교하기 →",
      link: "/pricing?tab=partner",
    },
    equipment: {
      bg: "from-green-50 to-green-100",
      border: "border-green-400",
      title: "내 집기를 더 빠르게 판매하세요",
      subtitle: "프리미엄 등록 시 상위 노출 + VIP 배지로 판매 확률 3배 증가",
      badges: ["상단노출", "VIP배지", "우선검색"],
      badgeColor: "bg-green-500",
      cta: "월 1만원부터 · 요금제 비교하기 →",
      link: "/pricing?tab=equipment",
    },
  };

  const c = config[type];

  return (
    <div
      className={`rounded-xl border-2 ${c.border} bg-gradient-to-br ${c.bg} p-6 text-center`}
    >
      {/* 제목 */}
      <h3 className="mb-2 text-xl font-bold text-gray-900">
        {c.title}
      </h3>

      {/* 부제 */}
      <p className="mb-4 text-sm text-gray-700">
        {c.subtitle}
      </p>

      {/* 혜택 배지 */}
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {c.badges.map((badge) => (
          <span
            key={badge}
            className={`${c.badgeColor} rounded-full px-3 py-1 text-xs font-semibold text-white`}
          >
            {badge}
          </span>
        ))}
      </div>

      {/* CTA 버튼 */}
      <Link
        href={c.link}
        className="inline-flex items-center gap-1 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
      >
        {c.cta}
      </Link>
    </div>
  );
}

// 1-D. 마이페이지 플랜 업그레이드 카드
export function DashboardPlanCard({ currentPlan }: { currentPlan?: string }) {
  const plan = currentPlan || "무료";

  // 이미 유료 플랜이면 렌더링 안함
  if (
    plan.toLowerCase().includes("premium") ||
    plan.toLowerCase().includes("프리미엄") ||
    plan.toLowerCase().includes("vip") ||
    plan.toLowerCase().includes("베이직")
  ) {
    return null;
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">
          내 매물 광고 현황
        </h3>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
          현재: {plan}
        </span>
      </div>

      {/* 비교 그리드 */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        {/* 현재 플랜 */}
        <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
          <div className="mb-3 text-center text-sm font-semibold text-gray-700">
            현재 플랜
          </div>
          <ul className="space-y-2 text-xs text-gray-600">
            <li>✓ 사진 5장</li>
            <li>✓ 일반 노출</li>
            <li>✗ 끌어올리기 불가</li>
            <li>✗ 통계 없음</li>
          </ul>
        </div>

        {/* 프리미엄 플랜 */}
        <div className="relative rounded-lg border-2 border-green-400 bg-white p-4">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-green-700 px-2 py-0.5 text-xs font-bold text-white">
            추천
          </div>
          <div className="mb-3 text-center text-sm font-semibold text-green-700">
            프리미엄
          </div>
          <ul className="space-y-2 text-xs text-green-700">
            <li>✓ 사진 20장</li>
            <li>✓ 상위 노출</li>
            <li>✓ 끌어올리기 5회</li>
            <li>✓ 조회수 통계</li>
          </ul>
        </div>
      </div>

      {/* CTA 버튼 */}
      <Link
        href="/pricing?tab=listing"
        className="block w-full rounded-lg bg-green-700 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-green-800"
      >
        프리미엄 시작하기 →
      </Link>
    </div>
  );
}

// 1-E. 홈 하단 3종 서비스 소개 (네이비 배경 + SVG 아이콘)
export function HomeServiceSection() {
  const services = [
    {
      title: "사장님",
      price: "월 10만원~",
      description:
        "내 매물을 더 빨리 팔고 싶다면. 상위노출, 하이라이트 배지, 끌어올리기로 매수자 유입 극대화",
      link: "/pricing?tab=listing",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      title: "프랜차이즈",
      price: "월 30만원~",
      description:
        "예비 창업자에게 브랜드를 알리세요. 브랜드 페이지, 가맹 문의, 메인 배너 노출",
      link: "/pricing?tab=franchise",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
          <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      title: "협력업체",
      price: "월 10만원~",
      description:
        "창업에 필요한 모든 전문 서비스를 사장님에게 직접 연결합니다",
      link: "/pricing?tab=partner",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="bg-green-700 py-10">
      <div className="mx-auto max-w-5xl px-6">
        {/* 헤더 */}
        <div className="mb-6 text-center">
          <h2 className="mb-1 text-xl font-bold text-white">
            권리샵과 함께 성장하세요
          </h2>
          <p className="text-xs text-white/50">
            역할에 맞는 최적의 서비스를 제공합니다
          </p>
        </div>

        {/* 서비스 그리드 */}
        <div className="grid gap-4 md:grid-cols-3">
          {services.map((service) => (
            <Link
              key={service.title}
              href={service.link}
              className="group rounded-xl bg-white/[0.07] border border-white/10 p-4 transition hover:bg-white/[0.12] hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3 mb-2">
                {/* SVG 아이콘 */}
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white/80 shrink-0">
                  {service.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {service.title}
                  </h3>
                  <p className="text-xs font-semibold text-white/70">
                    {service.price}
                  </p>
                </div>
              </div>

              {/* 설명 */}
              <p className="text-xs text-white/50 leading-relaxed mb-2">
                {service.description}
              </p>

              {/* 화살표 */}
              <div className="text-xs font-semibold text-white/70 transition group-hover:translate-x-1">
                자세히 보기 →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
