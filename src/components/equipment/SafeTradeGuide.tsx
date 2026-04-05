"use client";
import { useState } from "react";

export function SafeTradeBanner() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mb-6 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6 text-amber-600 dark:text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                안전한 거래를 위해 꼭 확인하세요
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                사기 피해 예방을 위한 필수 체크리스트
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="flex-shrink-0 px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-300 bg-white dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
          >
            가이드 보기
          </button>
        </div>
      </div>
      <SafeTradeModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function SafeTradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  const tips = [
    {
      number: 1,
      title: "현물 확인 후 거래",
      description: "반드시 직접 만나서 물건 상태를 확인한 후 결제하세요. 사진만으로 판단하지 마세요.",
      color: "green",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      textColor: "text-green-700 dark:text-green-300",
      borderColor: "border-green-200 dark:border-green-800"
    },
    {
      number: 2,
      title: "선입금 절대 금지",
      description: "선입금, 계약금, 예약금 등을 먼저 요구하면 사기입니다. 만나기 전 송금하지 마세요.",
      color: "red",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      textColor: "text-red-700 dark:text-red-300",
      borderColor: "border-red-200 dark:border-red-800"
    },
    {
      number: 3,
      title: "사업자인증 확인",
      description: "사업자인증 배지는 사업자등록번호의 유효성만 확인한 것이며, 판매자 본인 소유를 보장하지 않습니다. 거래 전 직접 확인을 권장합니다.",
      color: "amber",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
      textColor: "text-amber-700 dark:text-amber-300",
      borderColor: "border-amber-200 dark:border-amber-800"
    },
    {
      number: 4,
      title: "채팅 기록 보관",
      description: "권리샵 채팅으로 대화하면 거래 내용이 기록됩니다. 외부 메신저로 유도하는 판매자를 주의하세요.",
      color: "blue",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      textColor: "text-blue-700 dark:text-blue-300",
      borderColor: "border-blue-200 dark:border-blue-800"
    },
    {
      number: 5,
      title: "신고 기능 활용",
      description: "의심스러운 매물이나 판매자는 즉시 신고해주세요. 관리자가 확인 후 조치합니다.",
      color: "purple",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      textColor: "text-purple-700 dark:text-purple-300",
      borderColor: "border-purple-200 dark:border-purple-800"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white dark:bg-navy-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-navy-800 border-b border-gray-200 dark:border-navy-700 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-navy-100 dark:bg-navy-700 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-navy-600 dark:text-navy-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  안전거래 가이드
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  사기 피해를 예방하기 위한 필수 체크리스트
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="px-6 py-6 space-y-4">
          {tips.map((tip) => (
            <div
              key={tip.number}
              className={`rounded-lg border ${tip.borderColor} ${tip.bgColor} p-4`}
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full ${tip.textColor} font-bold flex items-center justify-center text-sm border-2 ${tip.borderColor}`}>
                    {tip.number}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold text-base mb-2 ${tip.textColor}`}>
                    {tip.title}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {tip.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="px-6 pb-6">
          <div className="bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-navy-700 rounded-lg p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              권리샵은 판매자와 구매자를 연결하는 플랫폼으로, 개별 거래에 대한 직접적인 책임을 지지 않습니다. 사업자인증은 등록번호 유효성 확인 서비스이며, 거래 상대방의 신원을 보증하지 않습니다. 거래 시 발생하는 분쟁은 당사자 간 해결해야 하며, 사기 피해 시 경찰청(112) 또는 사이버수사대에 신고해주세요.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-navy-800 border-t border-gray-200 dark:border-navy-700 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-navy-600 hover:bg-navy-700 dark:bg-navy-700 dark:hover:bg-navy-600 text-white font-medium rounded-lg transition-colors"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
}
