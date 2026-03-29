"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

interface ReviewData {
  id: string;
  accuracyRating: number;
  communicationRating: number;
  conditionRating: number;
  content: string | null;
  createdAt: string;
  reviewer: {
    id: string;
  };
}

interface ReportModalData {
  reviewId: string;
  reason: string;
  detail: string;
}

interface ReviewSectionProps {
  listingId: string;
  sellerId?: string;
}

function StarIcon({ filled, className = "w-4 h-4" }: { filled: boolean; className?: string }) {
  return (
    <svg
      className={`${className} ${filled ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function StarRating({
  rating,
  onChange,
  readonly = false,
  size = "sm",
}: {
  rating: number;
  onChange?: (r: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}) {
  const iconClass = size === "md" ? "w-6 h-6" : "w-4 h-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          className={`${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform`}
          disabled={readonly}
          aria-label={`${star}점`}
        >
          <StarIcon filled={star <= rating} className={iconClass} />
        </button>
      ))}
    </div>
  );
}

export default function ReviewSection({ listingId, sellerId }: ReviewSectionProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    accuracyRating: 5,
    communicationRating: 5,
    conditionRating: 5,
    content: "",
  });
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState<ReportModalData>({
    reviewId: "",
    reason: "SPAM",
    detail: "",
  });
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?listingId=${listingId}`);
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      router.push("/login");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          accuracyRating: formData.accuracyRating,
          communicationRating: formData.communicationRating,
          conditionRating: formData.conditionRating,
          content: formData.content,
        }),
      });

      if (res.ok) {
        toast.success("리뷰가 작성되었습니다.");
        setFormData({
          accuracyRating: 5,
          communicationRating: 5,
          conditionRating: 5,
          content: "",
        });
        setShowForm(false);
        fetchReviews();
      } else {
        const data = await res.json();
        toast.error(data.error || "리뷰 작성에 실패했습니다.");
      }
    } catch {
      toast.error("오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReportClick(reviewId: string) {
    if (!session) {
      router.push("/login");
      return;
    }
    setReportData({ reviewId, reason: "SPAM", detail: "" });
    setShowReportModal(true);
  }

  async function handleReportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      router.push("/login");
      return;
    }

    setReportSubmitting(true);
    try {
      const res = await fetch("/api/reviews/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: reportData.reviewId,
          reason: reportData.reason,
          detail: reportData.detail,
        }),
      });

      if (res.ok) {
        toast.success("신고가 접수되었습니다.");
        setShowReportModal(false);
        setReportData({ reviewId: "", reason: "SPAM", detail: "" });
      } else {
        const data = await res.json();
        toast.error(data.error || "신고 접수에 실패했습니다.");
      }
    } catch {
      toast.error("오류가 발생했습니다.");
    } finally {
      setReportSubmitting(false);
    }
  }

  // 본인 매물에는 리뷰 작성 불가
  const isOwnListing = session?.user?.id === sellerId;
  // 이미 리뷰를 작성했는지 확인
  const hasWrittenReview = reviews.some((r) => r.reviewer.id === session?.user?.id);
  const canWriteReview = session && !isOwnListing && !hasWrittenReview;

  const avgAccuracy = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.accuracyRating, 0) / reviews.length : 0;
  const avgCommunication = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.communicationRating, 0) / reviews.length : 0;
  const avgCondition = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.conditionRating, 0) / reviews.length : 0;
  const avgOverall = reviews.length > 0 ? (avgAccuracy + avgCommunication + avgCondition) / 3 : 0;

  if (loading) {
    return (
      <div className="py-4 border-b border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-24 mb-3" />
          <div className="h-4 bg-gray-200 rounded w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 border-b border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900">블라인드 리뷰 ({reviews.length})</h2>
        {canWriteReview && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            리뷰 작성
          </button>
        )}
      </div>

      {/* Average Ratings */}
      {reviews.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{avgOverall.toFixed(1)}</span>
            <StarRating rating={Math.round(avgOverall)} readonly size="md" />
            <span className="text-sm text-gray-500 dark:text-gray-400">({reviews.length}개)</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-1">매출 정보 정확성</p>
              <div className="flex items-center gap-1">
                <StarRating rating={Math.round(avgAccuracy)} readonly />
                <span className="text-gray-700 dark:text-gray-300 ml-1">{avgAccuracy.toFixed(1)}</span>
              </div>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-1">소통 원활성</p>
              <div className="flex items-center gap-1">
                <StarRating rating={Math.round(avgCommunication)} readonly />
                <span className="text-gray-700 dark:text-gray-300 ml-1">{avgCommunication.toFixed(1)}</span>
              </div>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-1">매물 상태 일치도</p>
              <div className="flex items-center gap-1">
                <StarRating rating={Math.round(avgCondition)} readonly />
                <span className="text-gray-700 dark:text-gray-300 ml-1">{avgCondition.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4 border border-blue-100 dark:border-blue-800">
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">블라인드 리뷰 작성</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            매도자에 대한 솔직한 경험을 공유해주세요. 작성자 정보는 익명으로 처리됩니다.
          </p>

          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">매출 정보 정확성</label>
              <StarRating rating={formData.accuracyRating} onChange={(r) => setFormData({ ...formData, accuracyRating: r })} size="md" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">소통 원활성</label>
              <StarRating rating={formData.communicationRating} onChange={(r) => setFormData({ ...formData, communicationRating: r })} size="md" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">매물 상태 일치도</label>
              <StarRating rating={formData.conditionRating} onChange={(r) => setFormData({ ...formData, conditionRating: r })} size="md" />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">상세 리뷰</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="이 매물에 대한 경험을 공유해주세요 (선택사항)"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
            >
              {submitting ? "작성 중..." : "작성 완료"}
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">아직 리뷰가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-bold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">익명 리뷰어</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating
                    rating={Math.round((review.accuracyRating + review.communicationRating + review.conditionRating) / 3)}
                    readonly
                  />
                  {session && review.reviewer.id !== session.user.id && (
                    <button
                      onClick={() => handleReportClick(review.id)}
                      className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                      title="신고하기"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-1.5">
                  <span className="text-gray-500 dark:text-gray-400">정확성 </span>
                  <StarRating rating={review.accuracyRating} readonly />
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-1.5">
                  <span className="text-gray-500 dark:text-gray-400">소통 </span>
                  <StarRating rating={review.communicationRating} readonly />
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-1.5">
                  <span className="text-gray-500 dark:text-gray-400">상태 </span>
                  <StarRating rating={review.conditionRating} readonly />
                </div>
              </div>

              {review.content && (
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{review.content}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">리뷰 신고</h3>
            <form onSubmit={handleReportSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  신고 사유 <span className="text-red-500">*</span>
                </label>
                <select
                  value={reportData.reason}
                  onChange={(e) => setReportData({ ...reportData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="SPAM">스팸/광고</option>
                  <option value="ABUSE">욕설/비방</option>
                  <option value="FALSE_INFO">허위 사실</option>
                  <option value="OTHER">기타</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  상세 내용 (선택)
                </label>
                <textarea
                  value={reportData.detail}
                  onChange={(e) => setReportData({ ...reportData, detail: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="신고 사유를 자세히 적어주세요"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowReportModal(false);
                    setReportData({ reviewId: "", reason: "SPAM", detail: "" });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
                >
                  {reportSubmitting ? "신고 중..." : "신고하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
