"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

interface QuestionData {
  id: string;
  content: string;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
  isOwn?: boolean;
  isSeller?: boolean;
  reviewer: {
    id: string;
    name: string | null;
    image: string | null;
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

export default function ReviewSection({ listingId, sellerId }: ReviewSectionProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerContent, setAnswerContent] = useState("");
  const [answerSubmitting, setAnswerSubmitting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState<ReportModalData>({
    reviewId: "",
    reason: "SPAM",
    detail: "",
  });
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const isOwnListing = session?.user?.id === sellerId;

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?listingId=${listingId}`);
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      router.push("/login");
      return;
    }
    if (!content.trim()) {
      toast.error("문의 내용을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, content: content.trim() }),
      });

      if (res.ok) {
        toast.success("문의가 등록되었습니다.");
        setContent("");
        setShowForm(false);
        fetchQuestions();
      } else {
        const data = await res.json();
        toast.error(data.error || "문의 등록에 실패했습니다.");
      }
    } catch {
      toast.error("오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

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
        fetchQuestions();
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
        <h2 className="font-bold text-gray-900 dark:text-white">Q&A 문의 ({questions.length})</h2>
        {session && !isOwnListing && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1 text-sm bg-navy-700 text-white rounded-lg hover:bg-navy-600 font-medium"
          >
            문의하기
          </button>
        )}
      </div>

      {/* Question Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-navy-50 dark:bg-navy-800/20 rounded-lg p-4 mb-4 border border-blue-100 dark:border-navy-700">
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">문의 작성</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            매물에 대해 궁금한 점을 질문해주세요. 판매자가 답변해드립니다.
          </p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            maxLength={2000}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            placeholder="예: 권리금 협의 가능한가요? / 매출 자료 확인 가능한가요?"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{content.length}/2,000</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setContent(""); }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="px-4 py-2 bg-navy-700 text-white rounded-lg hover:bg-navy-600 text-sm font-medium disabled:opacity-50"
              >
                {submitting ? "등록 중..." : "문의 등록"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Q&A List */}
      {questions.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">아직 문의가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              {/* Question */}
              <div className="p-4 bg-white dark:bg-gray-800">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-navy-100 dark:bg-blue-900 text-navy-700 dark:text-navy-400 text-xs font-bold">Q</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {q.reviewer.name || "회원"}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(q.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {session && !q.isOwn && (
                      <button
                        onClick={() => handleReportClick(q.id)}
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
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap pl-7">{q.content}</p>
              </div>

              {/* Answer */}
              {q.answer ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 text-xs font-bold">A</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">판매자</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-navy-100 dark:bg-blue-900 text-navy-700 dark:text-navy-300">판매자</span>
                    {q.answeredAt && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(q.answeredAt).toLocaleDateString("ko-KR")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap pl-7">{q.answer}</p>
                </div>
              ) : isOwnListing ? (
                /* Seller can answer */
                answeringId === q.id ? (
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
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
                        onClick={() => handleAnswerSubmit(q.id)}
                        disabled={answerSubmitting || !answerContent.trim()}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                      >
                        {answerSubmitting ? "등록 중..." : "답변 등록"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => { setAnsweringId(q.id); setAnswerContent(""); }}
                      className="text-sm text-yellow-700 dark:text-yellow-400 font-medium hover:underline"
                    >
                      답변 작성하기
                    </button>
                  </div>
                )
              ) : (
                <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
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
