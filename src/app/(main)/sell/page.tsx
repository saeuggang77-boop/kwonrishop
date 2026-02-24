import Link from "next/link";
import { FileText, CheckCircle, Users, DollarSign, TrendingUp, Shield, Camera, ChevronDown } from "lucide-react";

export default function SellPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy-dark to-[#1B3A5C]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 text-center md:py-24">
          <h1 className="font-heading text-3xl font-bold text-white md:text-5xl">
            점포 매물 등록, 무료로 시작하세요
          </h1>
          <p className="mt-4 text-lg text-white/80 md:text-xl">
            사진만 올리면 전국 매수자에게 노출됩니다
          </p>
          <Link
            href="/listings/new"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-accent-dark hover:shadow-xl active:scale-95 md:text-lg"
          >
            <FileText className="h-5 w-5" />
            무료 등록하기
          </Link>
          <p className="mt-3 text-sm text-white/60">
            월 2건까지 무료 · 신용카드 정보 불필요
          </p>
        </div>
      </section>

      {/* 등록 절차 3단계 */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-20">
        <h2 className="text-center text-2xl font-bold text-navy md:text-3xl">
          간단한 3단계로 매물 등록 완료
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          복잡한 절차 없이 빠르게 매물을 등록하세요
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3 md:gap-8">
          {/* Step 1 */}
          <div className="group relative flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy/10 text-2xl font-bold text-navy">
              1
            </div>
            <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-navy">매물 정보 입력</h3>
            <p className="mt-2 text-center text-sm text-gray-600">
              위치, 가격, 매출 등<br />기본 정보를 입력하세요
            </p>
          </div>

          {/* Step 2 */}
          <div className="group relative flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy/10 text-2xl font-bold text-navy">
              2
            </div>
            <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-navy">검수 및 노출</h3>
            <p className="mt-2 text-center text-sm text-gray-600">
              빠른 검수 후<br />즉시 매물 목록에 노출
            </p>
          </div>

          {/* Step 3 */}
          <div className="group relative flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy/10 text-2xl font-bold text-navy">
              3
            </div>
            <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-navy">매수자 문의 수신</h3>
            <p className="mt-2 text-center text-sm text-gray-600">
              관심있는 매수자의<br />문의를 받아보세요
            </p>
          </div>
        </div>
      </section>

      {/* 장점 4개 */}
      <section className="border-t border-gray-200 bg-white py-12 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold text-navy md:text-3xl">
            권리샵에서 매물을 등록해야 하는 이유
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* 무료 등록 */}
            <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <DollarSign className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="mt-4 text-base font-bold text-navy">무료 등록</h3>
              <p className="mt-2 text-sm text-gray-600">
                월 2건까지 완전 무료<br />추가 비용 없음
              </p>
            </div>

            {/* 전국 매수자 노출 */}
            <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                <TrendingUp className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="mt-4 text-base font-bold text-navy">전국 매수자 노출</h3>
              <p className="mt-2 text-sm text-gray-600">
                검증된 매수자에게<br />직접 노출
              </p>
            </div>

            {/* AI 권리금 진단서 */}
            <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
                <Shield className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="mt-4 text-base font-bold text-navy">AI 권리금 진단서</h3>
              <p className="mt-2 text-sm text-gray-600">
                적정 가격 분석으로<br />신뢰도 향상
              </p>
            </div>

            {/* 매출 인증 뱃지 */}
            <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                <Camera className="h-7 w-7 text-amber-600" />
              </div>
              <h3 className="mt-4 text-base font-bold text-navy">매출 인증 뱃지</h3>
              <p className="mt-2 text-sm text-gray-600">
                홈택스 인증으로<br />구매 확률 증가
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 py-12 md:py-20">
        <h2 className="text-center text-2xl font-bold text-navy md:text-3xl">
          자주 묻는 질문
        </h2>

        <div className="mt-10 space-y-4">
          <FAQItem
            question="등록 비용이 정말 무료인가요?"
            answer="네, 월 2건까지 완전 무료입니다. 추가 등록이 필요하시면 프리미엄 광고 상품을 이용하실 수 있습니다."
          />
          <FAQItem
            question="등록 후 노출까지 얼마나 걸리나요?"
            answer="검수는 영업일 기준 1-2일 소요되며, 검수 완료 즉시 매물 목록에 노출됩니다."
          />
          <FAQItem
            question="등록 후 수정이 가능한가요?"
            answer="네, 언제든지 내 매물 관리 페이지에서 정보를 수정하실 수 있습니다."
          />
          <FAQItem
            question="사진은 필수인가요?"
            answer="네, 최소 3장 이상의 사진이 필요합니다. 사진이 많을수록 매수자의 관심도가 높아집니다."
          />
          <FAQItem
            question="중개 수수료가 있나요?"
            answer="권리샵은 플랫폼 수수료를 받지 않습니다. 실제 거래 시 중개사와의 계약에 따라 중개 수수료가 발생할 수 있습니다."
          />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-gray-200 bg-gradient-to-br from-navy via-navy-dark to-[#1B3A5C] py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-heading text-2xl font-bold text-white md:text-3xl">
            지금 바로 무료로 등록하세요
          </h2>
          <p className="mt-3 text-base text-white/80 md:text-lg">
            전국의 검증된 매수자들이 당신의 매물을 기다리고 있습니다
          </p>
          <Link
            href="/listings/new"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-10 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-accent-dark hover:shadow-xl active:scale-95"
          >
            <FileText className="h-5 w-5" />
            지금 무료로 등록하기
          </Link>
        </div>
      </section>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-xl border border-gray-200 bg-white">
      <summary className="flex cursor-pointer items-center justify-between p-5 font-semibold text-navy transition-colors hover:bg-gray-50">
        <span className="text-sm md:text-base">{question}</span>
        <ChevronDown className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-gray-100 px-5 py-4">
        <p className="text-sm text-gray-600 md:text-base">{answer}</p>
      </div>
    </details>
  );
}
