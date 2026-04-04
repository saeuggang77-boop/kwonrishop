"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "@/lib/toast";

interface Review {
  id: string;
  content: string;
  answer: string | null;
  answeredAt: string | null;
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
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerContent, setAnswerContent] = useState("");
  const [answerSubmitting, setAnswerSubmitting] = useState(false);

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

  async function handleAnswerSubmit(questionId: string) {
    if (!answerContent.trim()) {
      toast.error("답변 내용을 입력해주세요.");
      return;
    }
    setAnswerSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${questionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: answerContent.trim() }),
      });
      if (res.ok) {
        toast.success("답변이 등록되었습니다.");
        setAnsweringId(null);
        setAnswerContent("");
        // Refresh data
        const refreshRes = await fetch("/api/mypage/reviews");
        const refreshData = await refreshRes.json();
        setReviews(refreshData);
      } else {
        const data = await res.json();
        toast.error(data.error || "답변 등록에 실패했습니다.");
      }
    } catch {
      toast.error("오류가 발생했습니다.");
    } finally {
      setAnswerSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Q&A 문의</h1>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const currentReviews = activeTab === "received" ? reviews.received : reviews.written;

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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Q&A 문의</h1>

      {/* 탭 */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("received")}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === "received"
              ? "text-navy-700 dark:text-navy-400 border-b-2 border-navy-600 dark:border-navy-400"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          받은 문의 <span className="text-sm">({reviews.received.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("written")}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === "written"
              ? "text-navy-700 dark:text-navy-400 border-b-2 border-navy-600 dark:border-navy-400"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          작성한 문의 <span className="text-sm">({reviews.written.length})</span>
        </button>
      </div>

      {/* 문의 목록 */}
      {currentReviews.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <p>
            {activeTab === "received"
              ? "아직 받은 문의가 없습니다"
              : "아직 작성한 문의가 없습니다"}
          </p>
          {activeTab === "written" && (
            <p className="text-sm mt-1">매물 상세 페이지에서 문의를 남겨보세요</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {currentReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* 매물 정보 헤더 */}
              <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <Link
                  href={`/listings/${review.listing.id}`}
                  className="font-medium text-gray-900 dark:text-white hover:text-navy-700 dark:hover:text-navy-400"
                >
                  {review.listing.storeName || "매물"}
                </Link>
                {activeTab === "written" && review.listing.user && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    판매자: {review.listing.user.name || "익명"}
                  </p>
                )}
              </div>

              {/* Question */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-navy-100 dark:bg-navy-900 text-navy-700 dark:text-navy-400 text-sm font-bold">Q</span>
                    <span className="text-sm text-gray-400 dark:text-gray-500">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
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
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap pl-8">
                  {review.content}
                </p>
              </div>

              {/* Answer */}
              {review.answer ? (
                <div className="px-5 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 text-sm font-bold">A</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">판매자</span>
                    {review.answeredAt && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(review.answeredAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap pl-8">
                    {review.answer}
                  </p>
                </div>
              ) : activeTab === "received" ? (
                /* Seller can answer */
                answeringId === review.id ? (
                  <div className="px-5 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                    <textarea
                      value={answerContent}
                      onChange={(e) => setAnswerContent(e.target.value)}
                      rows={3}
                      maxLength={2000}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      placeholder="답변을 입력하세요"
                    />
                    <div className="flex gap-2 mt-2 justify-end">
                      <button
                        onClick={() => { setAnsweringId(null); setAnswerContent(""); }}
                        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => handleAnswerSubmit(review.id)}
                        disabled={answerSubmitting || !answerContent.trim()}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                      >
                        {answerSubmitting ? "등록 중..." : "답변 등록"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-5 py-3 bg-navy-50 dark:bg-navy-900/20 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => { setAnsweringId(review.id); setAnswerContent(""); }}
                      className="text-sm text-navy-700 dark:text-navy-400 font-medium hover:underline"
                    >
                      답변 작성하기
                    </button>
                  </div>
                )
              ) : (
                <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center">아직 답변이 없습니다</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">문의 신고</h3>
            <form onSubmit={handleReportSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  신고 사유 <span className="text-red-500">*</span>
                </label>
                <select
                  value={reportData.reason}
                  onChange={(e) => setReportData({ ...reportData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
