"use client";

import { useState } from "react";

type UserType = "buyer" | "seller" | "franchise" | "partner";

interface Step {
  id: number;
  title: string;
  description: string;
  icon: string;
}

const guideData: Record<UserType, { title: string; subtitle: string; steps: Step[] }> = {
  buyer: {
    title: "예비창업자 가이드",
    subtitle: "상가 매물을 찾고 계신가요? 권리샵에서 안전하게 거래하세요",
    steps: [
      {
        id: 1,
        title: "회원가입",
        description: "카카오/네이버 소셜 로그인으로 간편하게 가입하세요. 별도 인증 없이 바로 이용 가능합니다.",
        icon: "👤",
      },
      {
        id: 2,
        title: "매물 검색",
        description: "지역, 업종, 가격대 등 다양한 조건으로 원하는 매물을 검색하세요. 지도 기반 검색으로 위치를 한눈에 확인할 수 있습니다.",
        icon: "🔍",
      },
      {
        id: 3,
        title: "매물 상세 확인",
        description: "매물 사진, 권리금, 월세, 평수, 매출 정보 등을 꼼꼼히 확인하세요. 사업자 인증된 매물만 노출되어 신뢰할 수 있습니다.",
        icon: "📋",
      },
      {
        id: 4,
        title: "관심 매물 저장",
        description: "마음에 드는 매물은 '관심 매물'에 저장하세요. 가격 변동 시 알림을 받을 수 있습니다.",
        icon: "⭐",
      },
      {
        id: 5,
        title: "판매자와 채팅",
        description: "매물 상세 페이지에서 '채팅하기' 버튼을 클릭하여 판매자와 1:1 채팅을 시작하세요. 개인정보 노출 없이 안전하게 소통할 수 있습니다.",
        icon: "💬",
      },
      {
        id: 6,
        title: "현장 방문 및 확인",
        description: "반드시 현장을 방문하여 점포 상태, 주변 환경, 유동인구 등을 직접 확인하세요. 사업자등록증, 임대차계약서 등 서류도 꼼꼼히 검토하세요.",
        icon: "🏪",
      },
      {
        id: 7,
        title: "직거래 및 계약",
        description: "판매자와 협의 후 직접 거래하세요. 필요시 공인중개사나 법무사의 도움을 받으시는 것을 권장합니다. 계약서 작성 시 권리금, 임대차 조건 등을 명확히 하세요.",
        icon: "✅",
      },
    ],
  },
  seller: {
    title: "사장님 가이드",
    subtitle: "점포를 판매하고 싶으신가요? 권리샵에서 직접 매수자를 만나세요",
    steps: [
      {
        id: 1,
        title: "회원가입",
        description: "카카오/네이버 소셜 로그인으로 간편하게 가입하세요. 회원 유형은 '사장님'을 선택하세요.",
        icon: "👤",
      },
      {
        id: 2,
        title: "사업자 인증",
        description: "국세청 API를 통한 사업자등록 진위확인을 진행합니다. 사업자번호, 대표자명, 개업일을 입력하면 즉시 인증됩니다.",
        icon: "🔐",
      },
      {
        id: 3,
        title: "매물등록 (1단계: 위치정보)",
        description: "카카오 주소 검색으로 점포의 주소를 입력하세요. 지번, 도로명, 건물명으로 검색 가능합니다.",
        icon: "📍",
      },
      {
        id: 4,
        title: "매물등록 (2~7단계)",
        description: "업종, 금액(보증금/월세/권리금), 평수, 층수, 매출·지출 정보, 매물 설명, 사진을 순서대로 입력하세요. 각 단계는 저장 후 이어서 작성 가능합니다.",
        icon: "📝",
      },
      {
        id: 5,
        title: "매물 노출 및 관리",
        description: "등록이 완료되면 즉시 매물이 노출됩니다. 마이페이지에서 매물 수정, 상태 변경, 통계 확인이 가능합니다.",
        icon: "📊",
      },
      {
        id: 6,
        title: "채팅 응대 및 협의",
        description: "매수 희망자의 채팅 문의에 신속하게 응대하세요. 현장 방문 일정을 잡고 상세한 정보를 제공하세요.",
        icon: "💬",
      },
      {
        id: 7,
        title: "광고 상품 이용 (선택)",
        description: "더 많은 노출을 원하시면 프리미엄/VIP 광고 상품을 이용하세요. 끌어올리기, 급매 태그 등 단건 상품도 있습니다.",
        icon: "🚀",
      },
    ],
  },
  franchise: {
    title: "프랜차이즈 본사 가이드",
    subtitle: "가맹점주를 모집하고 계신가요? 권리샵에서 브랜드를 홍보하세요",
    steps: [
      {
        id: 1,
        title: "회원가입",
        description: "카카오/네이버 소셜 로그인으로 가입 후 회원 유형은 '프랜차이즈 본사'를 선택하세요.",
        icon: "👤",
      },
      {
        id: 2,
        title: "사업자 인증",
        description: "국세청 API로 사업자등록 진위확인을 진행합니다. 사업자번호를 입력하면 즉시 인증됩니다.",
        icon: "🔐",
      },
      {
        id: 3,
        title: "공정위 브랜드 자동 매칭",
        description: "공정거래위원회 정보공개서 API와 자동으로 매칭됩니다. 매칭된 브랜드만 편집 권한이 부여되어 사칭을 방지합니다.",
        icon: "🔗",
      },
      {
        id: 4,
        title: "브랜드 페이지 기본 편집",
        description: "무료로 브랜드 소개, 연락처 등 기본 정보를 편집할 수 있습니다. 공정위 데이터(가맹비, 로열티, 가맹점수 등)는 자동으로 표시됩니다.",
        icon: "✏️",
      },
      {
        id: 5,
        title: "유료 구독 선택 (선택)",
        description: "브론즈(월 10만원), 실버(월 30만원), 골드(월 50만원) 구독으로 로고, 창업특혜 정보, 상위노출, 메인배너 등을 이용하세요.",
        icon: "💎",
      },
      {
        id: 6,
        title: "결제 및 즉시 활성화",
        description: "유료 상품 결제 시 승인 없이 즉시 활성화됩니다. 결제 완료 후 바로 브랜드 페이지가 노출됩니다.",
        icon: "💳",
      },
      {
        id: 7,
        title: "문의 접수 및 리포트",
        description: "가맹 문의를 실시간으로 받고, 월간 리포트(노출수, 클릭수, 문의수)를 확인하세요. 골드 구독은 매물 자동매칭 기능도 제공됩니다.",
        icon: "📈",
      },
    ],
  },
  partner: {
    title: "협력업체 가이드",
    subtitle: "상가 관련 서비스를 제공하시나요? 권리샵에서 고객을 만나세요",
    steps: [
      {
        id: 1,
        title: "회원가입",
        description: "카카오/네이버 소셜 로그인으로 가입 후 회원 유형은 '협력업체'를 선택하세요.",
        icon: "👤",
      },
      {
        id: 2,
        title: "사업자 인증",
        description: "국세청 API로 사업자등록 진위확인을 진행합니다. 사업자번호, 대표자명, 개업일을 입력하면 즉시 인증됩니다.",
        icon: "🔐",
      },
      {
        id: 3,
        title: "서비스 카테고리 선택",
        description: "제공하시는 서비스를 선택하세요. 인테리어, 간판, 주방기기, 법무/회계, 청소, 보험 등 다양한 카테고리가 있습니다.",
        icon: "🏷️",
      },
      {
        id: 4,
        title: "서비스 정보 등록",
        description: "서비스명, 상세 설명, 가격 정보, 시공 사진 등을 등록하세요. 매물 양도 시 필요한 서비스를 구체적으로 작성하세요.",
        icon: "📝",
      },
      {
        id: 5,
        title: "서비스 노출 및 관리",
        description: "등록 완료 후 즉시 협력업체 페이지에 노출됩니다. 마이페이지에서 서비스 수정, 문의 확인이 가능합니다.",
        icon: "📊",
      },
      {
        id: 6,
        title: "문의 응대 및 견적 제공",
        description: "매수자/매도자의 문의에 신속하게 응대하고 견적을 제공하세요. 채팅 또는 전화로 상담 가능합니다.",
        icon: "💬",
      },
      {
        id: 7,
        title: "광고 상품 이용 (선택)",
        description: "더 많은 노출을 원하시면 프리미엄 광고 상품을 이용하세요. 카테고리 상단 노출, 추천 배지 등을 제공합니다.",
        icon: "🚀",
      },
    ],
  },
};

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState<UserType>("buyer");

  const currentGuide = guideData[activeTab];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">이용가이드</h1>
          <p className="text-gray-600">
            권리샵 이용 방법을 단계별로 안내해드립니다
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <button
            onClick={() => setActiveTab("buyer")}
            className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "buyer"
                ? "bg-green-700 text-white shadow-lg"
                : "bg-white text-gray-700 border border-gray-200 hover:border-green-400"
            }`}
          >
            예비창업자
          </button>
          <button
            onClick={() => setActiveTab("seller")}
            className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "seller"
                ? "bg-green-700 text-white shadow-lg"
                : "bg-white text-gray-700 border border-gray-200 hover:border-green-400"
            }`}
          >
            사장님
          </button>
          <button
            onClick={() => setActiveTab("franchise")}
            className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "franchise"
                ? "bg-green-700 text-white shadow-lg"
                : "bg-white text-gray-700 border border-gray-200 hover:border-green-400"
            }`}
          >
            프랜차이즈
          </button>
          <button
            onClick={() => setActiveTab("partner")}
            className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "partner"
                ? "bg-green-700 text-white shadow-lg"
                : "bg-white text-gray-700 border border-gray-200 hover:border-green-400"
            }`}
          >
            협력업체
          </button>
        </div>

        {/* Guide Content */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {currentGuide.title}
            </h2>
            <p className="text-gray-600">{currentGuide.subtitle}</p>
          </div>

          {/* Steps */}
          <div className="space-y-6">
            {currentGuide.steps.map((step, index) => (
              <div
                key={step.id}
                className="flex gap-4 items-start p-5 rounded-lg bg-gray-50 hover:bg-green-50 transition-colors"
              >
                {/* Step Number & Icon */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-2xl">
                    {step.icon}
                  </div>
                  <div className="mt-2 text-center">
                    <span className="text-xs font-bold text-green-700">
                      STEP {step.id}
                    </span>
                  </div>
                </div>

                {/* Step Content */}
                <div className="flex-1 pt-2">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Connector Line (except last item) */}
                {index < currentGuide.steps.length - 1 && (
                  <div className="absolute left-8 mt-20 w-0.5 h-6 bg-green-200 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Additional Tips */}
        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            💡 추가 도움말
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-green-700 mt-0.5">•</span>
              <span>
                궁금한 내용은{" "}
                <a href="/faq" className="text-green-700 underline hover:text-green-700">
                  자주 묻는 질문
                </a>
                에서 확인하세요
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-700 mt-0.5">•</span>
              <span>
                문제가 있으시면{" "}
                <a href="/contact" className="text-green-700 underline hover:text-green-700">
                  고객센터
                </a>
                로 문의하세요
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-700 mt-0.5">•</span>
              <span>안전한 거래를 위해 반드시 현장 방문 및 서류 확인을 하세요</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-700 mt-0.5">•</span>
              <span>허위 매물을 발견하시면 즉시 신고해주세요</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">지금 바로 시작해보세요</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/login"
              className="px-6 py-3 bg-green-700 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
            >
              회원가입하기
            </a>
            <a
              href="/listings"
              className="px-6 py-3 bg-white text-green-700 font-semibold rounded-lg border border-green-600 hover:bg-green-50 transition-colors"
            >
              매물 둘러보기
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
