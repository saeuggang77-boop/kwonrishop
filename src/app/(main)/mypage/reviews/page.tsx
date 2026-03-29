"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "@/lib/toast";

interface Review {
  id: string;
  accuracyRating: number;
  communicationRating: number;
  conditionRating: number;
  content: string | null;
  createdAt: string;
  listing: {
    id: string;
    storeName: string | null;
    user?: {
      id: string;
      name: string | null;
    };
  };
}

interface ReviewsData {
  received: Review[];
  written: Review[];
}

interface ReportModalData {
  reviewId: string;
  reason: string;
  detail: string;
}

export default function ReviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewsData>({ received: [], written: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"received" | "written">("received");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState<ReportModalData>({
    reviewId: "",
    reason: "SPAM",
    detail: "",
  });
  const [reportSubmitting, setReportSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/mypage/reviews");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/mypage/reviews")
        .then((r) => r.json())
        .then((data) => {
          setReviews(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">리뷰</h1>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const currentReviews = activeTab === "received" ? reviews.received : reviews.written;

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${
              i < rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const getAverageRating = (review: Review) => {
    return Math.round(
      (review.accuracyRating + review.communicationRating + review.conditionRating) / 3
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  function handleReportClick(reviewId: string) {
    setReportData({ reviewId, reason: "SPAM", detail: "" });
    setShowReportModal(true);
  }

  async function handleReportSubmit(e: React.FormEvent) {
    e.preventDefault();
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">리뷰</h1>

      {/* 탭 */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("received")}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === "received"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          받은 리뷰 <span className="text-sm">({reviews.received.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("written")}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === "written"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          작성한 리뷰 <span className="text-sm">({reviews.written.length})</span>
        </button>
      </div>

      {/* 리뷰 목록 */}
      {currentReviews.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <p>
            {activeTab === "received"
              ? "아직 받은 리뷰가 없습니다"
              : "아직 작성한 리뷰가 없습니다"}
          </p>
          {activeTab === "written" && (
            <p className="text-sm mt-1">거래 완료 후 리뷰를 남겨보세요</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {currentReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {activeTab === "received" ? (
                    // 받은 리뷰: 블라인드 처리 (익명)
                    <>
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          익명 리뷰어
                        </p>
                        <Link
                          href={`/listings/${review.listing.id}`}
                          className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {review.listing.storeName || "매물"}
                        </Link>
                      </div>
                    </>
                  ) : (
                    // 작성한 리뷰: 매물 정보
                    <div>
                      <Link
                        href={`/listings/${review.listing.id}`}
                        className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {review.listing.storeName || "매물"}
                      </Link>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        판매자: {review.listing.user?.name || "익명"}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400 dark:text-gray-500">
                    {formatDate(review.createdAt)}
                  </span>
                  {activeTab === "received" && (
                    <button
                      onClick={() => handleReportClick(review.id)}
                      className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors p-1"
                      title="신고하기"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* 평점 */}
              <div className="flex items-center gap-2 mb-3">
                {renderStars(getAverageRating(review))}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getAverageRating(review)}.0
                </span>
              </div>

              {/* 세부 평점 */}
              <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                  <p className="text-gray-500 dark:text-gray-400 mb-1">매출 정보 정확성</p>
                  <div className="flex items-center gap-1">
                    {renderStars(review.accuracyRating)}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                  <p className="text-gray-500 dark:text-gray-400 mb-1">소통 원활성</p>
                  <div className="flex items-center gap-1">
                    {renderStars(review.communicationRating)}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                  <p className="text-gray-500 dark:text-gray-400 mb-1">매물 상태 일치도</p>
                  <div className="flex items-center gap-1">
                    {renderStars(review.conditionRating)}
                  </div>
                </div>
              </div>

              {/* 리뷰 내용 */}
              {review.content && (
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {review.content}
                </p>
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
