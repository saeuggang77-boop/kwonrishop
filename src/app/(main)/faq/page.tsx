"use client";

import { useState } from "react";

interface FAQItem {
  id: number;
  category: string;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: 1,
    category: "일반",
    question: "권리샵은 어떤 서비스인가요?",
    answer: "권리샵은 상가 점포를 직접 거래할 수 있는 플랫폼입니다. 중개 수수료 없이 매도자와 매수자가 직접 만나 거래할 수 있으며, 안전하고 투명한 거래 환경을 제공합니다.",
  },
  {
    id: 2,
    category: "일반",
    question: "수수료가 있나요?",
    answer: "권리샵은 직거래 플랫폼으로 중개 수수료가 없습니다. 매물 등록과 검색, 채팅 등 모든 기본 서비스는 무료로 이용하실 수 있습니다. 다만, 프리미엄 광고 등 부가 서비스는 별도 비용이 발생할 수 있습니다.",
  },
  {
    id: 3,
    category: "일반",
    question: "권리금이란 무엇인가요?",
    answer: "권리금은 영업권, 시설권, 바닥권 등을 포함하는 금액으로, 기존 사업자가 새로운 사업자에게 영업을 양도하면서 받는 대가입니다. 점포의 위치, 시설, 거래처 등의 가치를 금액으로 환산한 것입니다.",
  },
  {
    id: 4,
    category: "매물등록",
    question: "매물 등록은 어떻게 하나요?",
    answer: "로그인 후 '매물등록' 메뉴를 클릭하시면 등록 양식이 나타납니다. 점포 정보, 사진, 가격 정보 등을 입력하시고 사업자 인증을 완료하시면 매물이 등록됩니다. 허위 매물 방지를 위해 사업자 인증은 필수입니다.",
  },
  {
    id: 5,
    category: "매물등록",
    question: "사업자 인증은 왜 필요한가요?",
    answer: "허위 매물을 방지하고 신뢰할 수 있는 거래 환경을 만들기 위해 사업자 인증을 필수로 요구하고 있습니다. 사업자등록증을 업로드하시면 검토 후 인증이 완료되며, 인증된 매물만 공개됩니다.",
  },
  {
    id: 6,
    category: "매물등록",
    question: "매물 등록 후 수정이 가능한가요?",
    answer: "네, 마이페이지에서 언제든지 매물 정보를 수정하실 수 있습니다. 가격, 설명, 사진 등 대부분의 정보를 자유롭게 수정 가능하며, 수정 내용은 즉시 반영됩니다.",
  },
  {
    id: 7,
    category: "매물등록",
    question: "매물이 노출되지 않아요",
    answer: "매물이 노출되지 않는 경우는 다음과 같습니다: 1) 사업자 인증이 완료되지 않음 2) 관리자 검토 중 3) 매물 상태가 '비공개'로 설정됨 4) 필수 정보가 누락됨. 마이페이지에서 매물 상태를 확인하시고, 문제가 지속되면 고객센터로 문의해주세요.",
  },
  {
    id: 8,
    category: "거래",
    question: "채팅은 어떻게 시작하나요?",
    answer: "관심 있는 매물 상세 페이지에서 '채팅하기' 버튼을 클릭하시면 판매자와 1:1 채팅을 시작할 수 있습니다. 로그인이 필요하며, 채팅 내역은 마이페이지에서 확인하실 수 있습니다.",
  },
  {
    id: 9,
    category: "거래",
    question: "계약은 어떻게 진행하나요?",
    answer: "권리샵은 매도자와 매수자를 연결해주는 플랫폼입니다. 실제 계약은 당사자 간 직접 진행하시며, 필요시 공인중개사나 법무사의 도움을 받으시는 것을 권장합니다. 계약서 작성, 등기 이전 등은 전문가와 상담하시기 바랍니다.",
  },
  {
    id: 10,
    category: "거래",
    question: "허위 매물을 발견했어요",
    answer: "허위 매물을 발견하신 경우 해당 매물 페이지에서 '신고하기' 버튼을 클릭하거나, 고객센터로 제보해주세요. 신고가 접수되면 즉시 조사를 진행하며, 허위 매물로 확인되면 해당 매물 삭제 및 판매자에 대한 제재 조치가 이루어집니다.",
  },
  {
    id: 11,
    category: "거래",
    question: "안전한 거래를 위한 팁이 있나요?",
    answer: "1) 반드시 현장을 방문하여 점포 상태를 확인하세요. 2) 사업자등록증, 임대차계약서 등 서류를 꼼꼼히 확인하세요. 3) 보증금, 권리금 등 큰 금액은 에스크로 서비스를 이용하세요. 4) 계약서 작성 시 전문가의 도움을 받으세요. 5) 의심스러운 거래는 즉시 신고하세요.",
  },
  {
    id: 12,
    category: "결제",
    question: "프리미엄 광고는 어떻게 신청하나요?",
    answer: "마이페이지의 매물 관리에서 '광고하기' 버튼을 클릭하시면 프리미엄 광고 상품을 확인하고 신청하실 수 있습니다. 결제는 신용카드, 계좌이체 등 다양한 방법으로 가능합니다.",
  },
  {
    id: 13,
    category: "결제",
    question: "결제 취소는 어떻게 하나요?",
    answer: "광고 상품 결제 후 광고 노출이 시작되기 전까지는 전액 환불이 가능합니다. 단, 광고 노출이 시작된 이후에는 환불이 불가하며, 매장 판매·매물 삭제 등 회원 사정으로 광고를 중단하는 경우에도 환불되지 않습니다. 끌어올리기 등 즉시 소모되는 서비스도 사용 후 환불이 불가합니다. 자세한 내용은 이용약관 제10조(청약철회 및 환불)를 참고해주세요.",
  },
  {
    id: 14,
    category: "결제",
    question: "세금계산서 발행이 가능한가요?",
    answer: "네, 사업자 회원의 경우 세금계산서 발행이 가능합니다. 결제 시 세금계산서 발행을 선택하시고 사업자 정보를 입력하시면, 결제 익일에 국세청 승인 세금계산서가 발행됩니다.",
  },
  {
    id: 15,
    category: "계정",
    question: "회원 탈퇴는 어떻게 하나요?",
    answer: "마이페이지 > 계정 설정에서 회원 탈퇴를 신청하실 수 있습니다. 진행 중인 거래나 활성화된 매물이 있는 경우 탈퇴가 제한될 수 있으며, 탈퇴 시 모든 정보는 복구할 수 없습니다.",
  },
  {
    id: 16,
    category: "계정",
    question: "비밀번호를 잊어버렸어요",
    answer: "로그인 페이지에서 '비밀번호 찾기'를 클릭하시고 가입 시 등록한 이메일을 입력하시면, 비밀번호 재설정 링크가 발송됩니다. 이메일이 오지 않는 경우 스팸함을 확인하시거나 고객센터로 문의해주세요.",
  },
  {
    id: 17,
    category: "프랜차이즈",
    question: "프랜차이즈 정보는 어디서 오나요?",
    answer: "프랜차이즈 정보는 공정거래위원회의 가맹사업 정보공개서(FDD)를 기반으로 제공됩니다. 가맹 본부가 공개한 공식 정보이므로 신뢰하실 수 있으며, 최신 정보를 반영하기 위해 정기적으로 업데이트됩니다.",
  },
  {
    id: 18,
    category: "프랜차이즈",
    question: "프랜차이즈 창업 비용은 얼마나 드나요?",
    answer: "프랜차이즈별로 가맹비, 인테리어 비용, 교육비 등이 다르며, 각 브랜드 상세 페이지에서 예상 비용을 확인하실 수 있습니다. 실제 비용은 점포 크기, 위치 등에 따라 달라질 수 있으므로, 정확한 비용은 가맹 본부와 상담하시기 바랍니다.",
  },
  {
    id: 19,
    category: "커뮤니티",
    question: "커뮤니티 이용 규칙이 있나요?",
    answer: "커뮤니티는 건전한 정보 공유와 소통의 공간입니다. 욕설, 비방, 허위 정보, 광고성 게시물은 삭제되며 반복 시 이용이 제한될 수 있습니다. 타인을 존중하고 유익한 정보를 공유해주세요.",
  },
  {
    id: 20,
    category: "커뮤니티",
    question: "내 게시글이 삭제되었어요",
    answer: "커뮤니티 운영 정책에 위배되는 게시글은 사전 통보 없이 삭제될 수 있습니다. 삭제 사유는 마이페이지의 알림에서 확인하실 수 있으며, 이의가 있으신 경우 고객센터로 문의해주세요.",
  },
];

const categories = ["전체", "일반", "매물등록", "거래", "결제", "계정", "프랜차이즈", "커뮤니티"];

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const filteredFAQs = faqData.filter((item) => {
    const matchCategory = selectedCategory === "전체" || item.category === selectedCategory;
    const matchKeyword =
      searchKeyword === "" ||
      item.question.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchCategory && matchKeyword;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">자주 묻는 질문</h1>
          <p className="text-gray-600">궁금하신 내용을 빠르게 찾아보세요</p>
        </div>

        {/* 검색 */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="질문을 검색하세요..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <svg
              className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-green-700 text-white"
                  : "bg-white text-gray-600 border border-gray-300 hover:border-green-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ 목록 */}
        {filteredFAQs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">검색 결과가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFAQs.map((item) => (
              <div
                key={item.id}
                className="bg-cream rounded-2xl border border-line overflow-hidden"
              >
                <button
                  onClick={() => setOpenId(openId === item.id ? null : item.id)}
                  className="w-full px-5 py-4 text-left flex items-start justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900">{item.question}</p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                      openId === item.id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openId === item.id && (
                  <div className="px-5 pb-4 pt-1">
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 추가 도움말 */}
        <div className="mt-12 bg-green-50 rounded-xl p-6 text-center">
          <h3 className="font-bold text-gray-900 mb-2">찾으시는 답변이 없나요?</h3>
          <p className="text-sm text-gray-600 mb-4">
            고객센터로 문의하시면 빠르게 도와드리겠습니다
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="tel:1588-7928"
              className="px-5 py-2.5 bg-white text-green-700 font-medium rounded-lg border border-green-600 hover:bg-green-50 transition-colors"
            >
              전화 문의: 1588-7928
            </a>
            <a
              href="mailto:samsungcu@naver.com"
              className="px-5 py-2.5 bg-green-700 text-white font-medium rounded-lg hover:bg-green-800 transition-colors"
            >
              이메일 문의
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
