"use client";

import { useState } from "react";
import { X, Loader2, ArrowUp, Flame, RefreshCw, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatNumber } from "@/lib/utils/format";

interface PaidServiceModalProps {
  listingId: string;
  listingTitle: string;
  type: "JUMP_UP" | "URGENT_TAG" | "AUTO_REFRESH";
  onClose: () => void;
}

const SERVICE_CONFIG = {
  JUMP_UP: {
    icon: ArrowUp,
    title: "점프업",
    price: 5000,
    duration: "24시간",
    description: "매물을 해당 지역 검색 결과 최상단으로 끌어올립니다.",
    benefits: [
      "24시간 동안 상단 노출",
      "하루 최대 3회 구매 가능",
      "해당 지역 검색에서 우선 표시",
    ],
    color: "blue" as const,
    successMsg: "점프업이 적용되었습니다! 24시간 동안 상단 노출됩니다.",
  },
  URGENT_TAG: {
    icon: Flame,
    title: "급매 태그",
    price: 9900,
    duration: "7일",
    description: "매물에 '급매' 태그를 추가하여 긴급 매물로 표시합니다.",
    benefits: [
      "빨간 '급매' 태그 매물 카드에 표시",
      "급매 필터에서 노출",
      "만료 후 자동 해제",
    ],
    color: "red" as const,
    successMsg: "급매 태그가 등록되었습니다!",
    durationOptions: [
      { days: "7", label: "7일", price: 9900 },
      { days: "30", label: "30일", price: 29000, badge: "27% 할인" },
    ],
  },
  AUTO_REFRESH: {
    icon: RefreshCw,
    title: "자동 갱신",
    price: 79000,
    duration: "30일",
    description: "매일 오전 9시에 자동으로 점프업이 실행됩니다.",
    benefits: [
      "매일 자동 점프업 (30회)",
      "개별 점프업 대비 47% 할인",
      "30일간 매일 상단 노출",
    ],
    color: "green" as const,
    successMsg: "자동 갱신이 활성화되었습니다! 30일간 매일 자동 점프업됩니다.",
  },
} as const;

const colorClasses = {
  blue: {
    button: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    icon: "text-blue-600",
    iconBg: "bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
  },
  red: {
    button: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    icon: "text-red-600",
    iconBg: "bg-red-50",
    badge: "bg-red-100 text-red-700",
  },
  green: {
    button: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
    icon: "text-green-600",
    iconBg: "bg-green-50",
    badge: "bg-green-100 text-green-700",
  },
};

export function PaidServiceModal({
  listingId,
  listingTitle,
  type,
  onClose,
}: PaidServiceModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [reason, setReason] = useState("");
  const [urgentDuration, setUrgentDuration] = useState<"7" | "30">("7");

  const config = SERVICE_CONFIG[type];
  const Icon = config.icon;
  const colors = colorClasses[config.color];

  // For URGENT_TAG, use the selected duration's price
  const urgentConfig = SERVICE_CONFIG.URGENT_TAG;
  const durationOptions = type === "URGENT_TAG" ? urgentConfig.durationOptions : null;
  const selectedOption = durationOptions?.find((o: { days: string; label: string; price: number; badge?: string }) => o.days === urgentDuration);
  const activePrice = selectedOption ? selectedOption.price : config.price;
  const activeDuration = selectedOption ? selectedOption.label : config.duration;

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      const body: Record<string, string> = { listingId, type };
      if (type === "URGENT_TAG") {
        body.duration = urgentDuration;
        if (reason.trim()) {
          body.reason = reason.trim();
        }
      }

      const res = await fetch("/api/paid-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.error || `결제에 실패했습니다. (${res.status})`
        );
      }

      setSuccess(true);

      setTimeout(() => {
        router.refresh();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl max-w-md w-full mx-4 overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${colors.iconBg}`}>
              <Icon className={`w-5 h-5 ${colors.icon}`} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {config.title}
              </h2>
              <p className="text-sm text-gray-500 truncate max-w-[200px]">
                {listingTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 space-y-5">
          {/* Duration selector for URGENT_TAG */}
          {durationOptions && (
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              {durationOptions.map((opt: { days: string; label: string; price: number; badge?: string }) => (
                <button
                  key={opt.days}
                  onClick={() => setUrgentDuration(opt.days as "7" | "30")}
                  className={`flex-1 relative py-2.5 px-3 rounded-md text-sm font-medium transition-all ${
                    urgentDuration === opt.days
                      ? "bg-white text-red-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {opt.label} ₩{formatNumber(opt.price)}
                  {opt.badge && urgentDuration === opt.days && (
                    <span className="absolute -top-2 -right-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {opt.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Price & Duration */}
          <div className="text-center py-4 bg-gray-50 rounded-xl">
            <p className="text-3xl font-bold text-gray-900">
              ₩{formatNumber(activePrice)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {activeDuration} 이용
            </p>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 leading-relaxed">
            {config.description}
          </p>

          {/* Benefits */}
          <ul className="space-y-2.5">
            {config.benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <div className="mt-0.5 flex-shrink-0">
                  <Check className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-sm text-gray-700">{benefit}</span>
              </li>
            ))}
          </ul>

          {/* Urgent tag reason textarea */}
          {type === "URGENT_TAG" && (
            <div>
              <label
                htmlFor="urgent-reason"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                급매 사유{" "}
                <span className="text-gray-400 font-normal">(선택)</span>
              </label>
              <textarea
                id="urgent-reason"
                value={reason}
                onChange={(e) => {
                  if (e.target.value.length <= 30) {
                    setReason(e.target.value);
                  }
                }}
                placeholder="예: 이민 준비, 계약 만료 임박"
                maxLength={30}
                rows={2}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm
                  placeholder:text-gray-400 focus:outline-none focus:ring-2
                  focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {reason.length}/30
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{config.successMsg}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            disabled={loading || success}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700
              bg-white border border-gray-300 rounded-lg hover:bg-gray-50
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || success}
            className={`flex-1 px-4 py-2.5 text-sm font-medium text-white
              rounded-lg transition-colors focus:outline-none focus:ring-2
              focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2 ${colors.button}`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                처리 중...
              </>
            ) : success ? (
              <>
                <Check className="w-4 h-4" />
                완료
              </>
            ) : (
              `₩${formatNumber(activePrice)} 결제하기`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
