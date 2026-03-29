"use client";

import Link from "next/link";

// 1-A. 매물 목록 인피드 프로모션 카드
export function ListingInfeedPromo() {
  return (
    <div className="relative rounded-xl border-2 border-dashed border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 p-6 dark:from-blue-950 dark:to-blue-900">
      {/* AD 배지 */}
      <div className="absolute right-4 top-4 rounded bg-blue-500 px-2 py-0.5 text-xs font-semibold text-white">
        AD
      </div>

      {/* 제목 */}
      <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
        내 매물, 더 빨리 팔고 싶다면?
      </h3>

      {/* 설명 */}
      <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
        프리미엄 등록 사장님의 평균 문의량이 일반 대비 3배 높습니다
      </p>

      {/* 비교 카드 */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        {/* 일반 매물 */}
        <div className="rounded-lg border-2 border-gray-300 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
          <div className="mb-1 text-xs text-gray-600 dark:text-gray-400">
            일반 매물
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            12<span className="text-sm font-normal">회/월</span>
          </div>
        </div>

        {/* 프리미엄 매물 */}
        <div className="rounded-lg border-2 border-amber-400 bg-white p-3 dark:border-amber-500 dark:bg-gray-800">
          <div className="mb-1 text-xs text-amber-600 dark:text-amber-400">
            프리미엄 매물
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            36<span className="text-sm font-normal">회/월</span>
          </div>
        </div>
      </div>

      {/* CTA 버튼 */}
      <Link
        href="/pricing"
        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        요금제 보기 →
      </Link>
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
    <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-amber-100 p-6 dark:from-amber-950 dark:to-amber-900 md:flex-row">
      {/* 이모지 */}
      <div className="text-5xl">🚀</div>

      {/* 중앙 텍스트 */}
      <div className="flex-1 text-center md:text-left">
        <h3 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">
          이 매물의 노출을 극대화하세요
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          프리미엄 전환 시 상위 노출 + 하이라이트 배지 + 끌어올리기 5회 제공
        </p>
        {currentPlan && (
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            현재 플랜: {currentPlan}
          </p>
        )}
      </div>

      {/* CTA 버튼 */}
      <Link
        href="/pricing"
        className="whitespace-nowrap rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
      >
        업그레이드
      </Link>
    </div>
  );
}

// 1-C. 프랜차이즈/협력업체 등록 유도
export function RegisterPromoBanner({
  type,
}: {
  type: "franchise" | "partner";
}) {
  const config = {
    franchise: {
      bg: "from-green-50 to-green-100 dark:from-green-950 dark:to-green-900",
      border: "border-green-400",
      title: "내 프랜차이즈 브랜드를 권리샵에 등록하세요",
      subtitle: "예비 창업자 월 12,000명이 검색",
      badges: ["브랜드 상세", "가맹문의", "상위노출"],
      badgeColor: "bg-green-500",
      cta: "월 30만원부터 →",
      link: "/pricing?tab=franchise",
    },
    partner: {
      bg: "from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900",
      border: "border-blue-400",
      title: "상가 창업에 필요한 전문 서비스를 제공하시나요?",
      subtitle: "인테리어, 설비, 법무, 세무, 간판 등 사장님들이 찾는 서비스를 직접 연결합니다",
      badges: ["업체프로필", "포트폴리오", "매물상세연동"],
      badgeColor: "bg-blue-500",
      cta: "월 10만원부터 →",
      link: "/pricing?tab=partner",
    },
  };

  const c = config[type];

  return (
    <div
      className={`rounded-xl border-2 ${c.border} bg-gradient-to-br ${c.bg} p-6 text-center`}
    >
      {/* 제목 */}
      <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
        {c.title}
      </h3>

      {/* 부제 */}
      <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
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
        className="inline-flex items-center gap-1 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
      >
        {c.cta}
      </Link>
    </div>
  );
}

// 1-D. 마이페이지 플랜 업그레이드 카드
export function DashboardPlanCard({ currentPlan }: { currentPlan?: string }) {
  const plan = currentPlan || "무료";

  // 이미 프리미엄 이상이면 렌더링 안함
  if (
    plan.toLowerCase().includes("premium") ||
    plan.toLowerCase().includes("프리미엄")
  ) {
    return null;
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          내 매물 광고 현황
        </h3>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-300">
          현재: {plan}
        </span>
      </div>

      {/* 비교 그리드 */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        {/* 현재 플랜 */}
        <div className="rounded-lg border border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700">
          <div className="mb-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
            현재 플랜
          </div>
          <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <li>✓ 사진 5장</li>
            <li>✓ 일반 노출</li>
            <li>✗ 끌어올리기 불가</li>
            <li>✗ 통계 없음</li>
          </ul>
        </div>

        {/* 프리미엄 플랜 */}
        <div className="relative rounded-lg border-2 border-amber-400 bg-white p-4 dark:border-amber-500 dark:bg-gray-800">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
            추천
          </div>
          <div className="mb-3 text-center text-sm font-semibold text-amber-600 dark:text-amber-400">
            프리미엄
          </div>
          <ul className="space-y-2 text-xs text-amber-600 dark:text-amber-400">
            <li>✓ 사진 20장</li>
            <li>✓ 상위 노출</li>
            <li>✓ 끌어올리기 5회</li>
            <li>✓ 조회수 통계</li>
          </ul>
        </div>
      </div>

      {/* CTA 버튼 */}
      <Link
        href="/pricing"
        className="block w-full rounded-lg bg-amber-600 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
      >
        프리미엄 시작하기 →
      </Link>
    </div>
  );
}

// 1-E. 홈 하단 3종 서비스 소개
export function HomeServiceSection() {
  const services = [
    {
      emoji: "🏪",
      title: "사장님",
      price: "월 10만원~",
      description:
        "내 매물을 더 빨리 팔고 싶다면. 상위노출, 하이라이트 배지, 끌어올리기로 매수자 유입 극대화",
      link: "/pricing?tab=listing",
      color: "hover:border-blue-400 dark:hover:border-blue-500",
    },
    {
      emoji: "🏢",
      title: "프랜차이즈",
      price: "월 30만원~",
      description:
        "예비 창업자에게 브랜드를 알리세요. 브랜드 페이지, 가맹 문의, 메인 배너 노출",
      link: "/pricing?tab=franchise",
      color: "hover:border-green-400 dark:hover:border-green-500",
    },
    {
      emoji: "🔧",
      title: "협력업체",
      price: "월 10만원~",
      description:
        "창업에 필요한 모든 전문 서비스를 사장님에게 직접 연결합니다. 포트폴리오, 추천업체 배지",
      link: "/pricing?tab=partner",
      color: "hover:border-amber-400 dark:hover:border-amber-500",
    },
  ];

  return (
    <section className="bg-gray-50 py-16 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
            권리샵과 함께 성장하세요
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            역할에 맞는 최적의 서비스를 제공합니다
          </p>
        </div>

        {/* 서비스 그리드 */}
        <div className="grid gap-6 md:grid-cols-3">
          {services.map((service) => (
            <Link
              key={service.title}
              href={service.link}
              className={`group rounded-xl border-2 border-gray-200 bg-white p-6 transition dark:border-gray-700 dark:bg-gray-800 ${service.color} hover:shadow-lg`}
            >
              {/* 이모지 */}
              <div className="mb-4 text-5xl">{service.emoji}</div>

              {/* 제목 + 가격 */}
              <div className="mb-2 flex items-baseline justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {service.title}
                </h3>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  {service.price}
                </span>
              </div>

              {/* 설명 */}
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {service.description}
              </p>

              {/* 화살표 */}
              <div className="mt-4 text-sm font-semibold text-gray-900 transition group-hover:translate-x-1 dark:text-white">
                자세히 보기 →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
