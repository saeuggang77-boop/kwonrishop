import Image from "next/image";
import Link from "next/link";
import { Search, Shield, BarChart3, FileText } from "lucide-react";
import { AuthNavItems } from "./(main)/auth-nav";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logos/krw_shop_logo_symbol_transparent.png"
              alt="권리샵"
              width={36}
              height={36}
              priority
            />
            <span className="font-heading text-xl font-bold text-navy">
              권리샵
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/listings" className="text-sm text-gray-600 hover:text-navy">
              매물 검색
            </Link>
            <Link href="/legal/terms" className="text-sm text-gray-600 hover:text-navy">
              이용약관
            </Link>
            <AuthNavItems />
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-navy to-navy-light py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="font-heading text-4xl font-bold leading-tight md:text-5xl">
            부동산 권리 분석,
            <br />
            <span className="text-mint">한 곳에서 안전하게</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300">
            전세권, 저당권, 임차권 등 다양한 부동산 권리 매물을 분석하고
            비교하세요. AI 기반 시세 분석과 심층 리포트로 안전한 거래를
            도와드립니다.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/listings"
              className="rounded-lg bg-mint px-8 py-3 text-lg font-medium text-white hover:bg-mint-dark"
            >
              매물 둘러보기
            </Link>
            <Link
              href="/register"
              className="rounded-lg border border-white/30 px-8 py-3 text-lg font-medium text-white hover:bg-white/10"
            >
              무료 가입
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-center font-heading text-3xl font-bold text-navy">
            권리샵이 제공하는 서비스
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Search className="h-8 w-8 text-mint" />}
              title="매물 검색"
              description="지역, 권리유형, 가격대별로 원하는 매물을 쉽게 찾아보세요."
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8 text-mint" />}
              title="시세 분석"
              description="AI 기반 가치 평가와 주변 시세 비교로 적정가를 확인하세요."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8 text-mint" />}
              title="안전 거래"
              description="자동 사기탐지 시스템으로 의심 매물을 사전에 걸러냅니다."
            />
            <FeatureCard
              icon={<FileText className="h-8 w-8 text-mint" />}
              title="심층 리포트"
              description="전문가 수준의 권리 분석 리포트를 PDF로 받아보세요."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-heading text-2xl font-bold text-navy">
            지금 시작하세요
          </h2>
          <p className="mt-4 text-gray-600">
            무료 가입으로 매물 검색과 기본 분석 기능을 이용할 수 있습니다.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-block rounded-lg bg-mint px-8 py-3 font-medium text-white hover:bg-mint-dark"
          >
            무료로 시작하기
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <Image
                src="/logos/krw_shop_logo_symbol_transparent.png"
                alt="권리샵"
                width={28}
                height={28}
              />
              <span className="font-heading text-sm font-bold text-navy">
                권리샵
              </span>
            </div>
            <nav className="flex gap-6 text-sm text-gray-500">
              <Link href="/legal/terms" className="hover:text-navy">
                이용약관
              </Link>
              <Link href="/legal/privacy" className="hover:text-navy">
                개인정보처리방침
              </Link>
              <Link href="/legal/disclaimer" className="hover:text-navy">
                면책조항
              </Link>
            </nav>
            <p className="text-xs text-gray-400">
              &copy; 2026 권리샵. All rights reserved.
            </p>
          </div>
          <p className="mt-6 text-center text-xs text-gray-400">
            본 서비스에서 제공하는 분석 정보는 참고용이며, 플랫폼은 매물의
            정확성을 보증하지 않습니다.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-mint/10">
        {icon}
      </div>
      <h3 className="mt-4 font-heading text-lg font-bold text-navy">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </div>
  );
}
