"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { MessageSquare, Star, X, LogIn } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/utils/format";
import {
  EXPERT_INQUIRY_STATUS_LABELS,
  EXPERT_CATEGORY_LABELS,
} from "@/lib/utils/constants";

interface ExpertInfo {
  id: string;
  name: string;
  category: string;
  title: string;
  profileImage: string | null;
}

interface ReviewInfo {
  id: string;
  rating: number;
}

interface ConsultationItem {
  id: string;
  expertId: string;
  subject: string;
  message: string;
  category: string;
  status: string;
  createdAt: string;
  expert: ExpertInfo;
  review: ReviewInfo | null;
}

const STATUS_BADGE_CONFIG: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-700" },
  REPLIED: { bg: "bg-blue-100", text: "text-blue-700" },
  COMPLETED: { bg: "bg-green-100", text: "text-green-700" },
  CANCELLED: { bg: "bg-gray-100", text: "text-gray-500" },
};

export default function MyConsultationsPage() {
  const { status: authStatus } = useSession();
  const { toast } = useToast();

  const [consultations, setConsultations] = useState<ConsultationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<ConsultationItem | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewContent, setReviewContent] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchConsultations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/expert-inquiries");
      const json = await res.json();
      if (json.data) {
        setConsultations(json.data);
      }
    } catch {
      toast("error", "상담 내역을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchConsultations();
    } else if (authStatus === "unauthenticated") {
      setLoading(false);
    }
  }, [authStatus, fetchConsultations]);

  const openReviewModal = (consultation: ConsultationItem) => {
    setReviewTarget(consultation);
    setReviewRating(0);
    setReviewContent("");
    setReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setReviewModalOpen(false);
    setReviewTarget(null);
    setReviewRating(0);
    setReviewContent("");
  };

  const submitReview = async () => {
    if (!reviewTarget) return;
    if (reviewRating === 0) {
      toast("error", "평점을 선택해주세요.");
      return;
    }
    if (!reviewContent.trim()) {
      toast("error", "리뷰 내용을 입력해주세요.");
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/expert-inquiries/${reviewTarget.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: reviewRating,
          content: reviewContent.trim(),
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message ?? "리뷰 등록에 실패했습니다.");
      }

      toast("success", "리뷰가 등록되었습니다.");
      closeReviewModal();
      fetchConsultations();
    } catch (err) {
      const message = err instanceof Error ? err.message : "리뷰 등록에 실패했습니다.";
      toast("error", message);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Unauthenticated state
  if (authStatus === "unauthenticated") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mt-20 text-center">
          <LogIn className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-600">로그인이 필요합니다</h3>
          <p className="mt-2 text-sm text-gray-500">상담 내역을 확인하려면 먼저 로그인해주세요.</p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white hover:bg-accent-dark"
          >
            로그인
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">내 상담 내역</h1>
          <p className="mt-1 text-sm text-gray-500">전문가 상담 신청 내역을 확인하세요</p>
        </div>
        <Link
          href="/experts"
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-dark"
        >
          전문가 찾기
        </Link>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="mt-12 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-16 rounded bg-gray-200" />
                    <div className="h-5 w-48 rounded bg-gray-200" />
                  </div>
                  <div className="h-4 w-32 rounded bg-gray-200" />
                  <div className="h-4 w-24 rounded bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : consultations.length === 0 ? (
        /* Empty State */
        <div className="mt-20 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-600">아직 상담 신청이 없습니다</h3>
          <p className="mt-2 text-sm text-gray-500">전문가에게 상담을 신청해보세요.</p>
          <Link
            href="/experts"
            className="mt-6 inline-block rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white hover:bg-accent-dark"
          >
            전문가 찾기
          </Link>
        </div>
      ) : (
        /* Consultation List */
        <div className="mt-8 space-y-4">
          {consultations.map((item) => {
            const statusConfig = STATUS_BADGE_CONFIG[item.status] ?? STATUS_BADGE_CONFIG.PENDING;
            const statusLabel = EXPERT_INQUIRY_STATUS_LABELS[item.status] ?? item.status;
            const categoryLabel = EXPERT_CATEGORY_LABELS[item.expert.category] ?? item.expert.category;
            const canReview = item.status === "COMPLETED" && !item.review;

            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Expert Avatar */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy/10 text-sm font-bold text-navy">
                      {item.expert.name.charAt(0)}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Status + Subject */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                          {statusLabel}
                        </span>
                        <h3 className="truncate font-bold text-gray-900">{item.subject}</h3>
                      </div>

                      {/* Expert Info */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                        <span className="font-medium text-gray-700">{item.expert.name}</span>
                        <span className="text-gray-300">|</span>
                        <span>{item.expert.title}</span>
                      </div>

                      {/* Category Tag + Date */}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          {categoryLabel}
                        </span>
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          {item.category}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Review Button */}
                    {canReview && (
                      <button
                        onClick={() => openReviewModal(item)}
                        className="shrink-0 rounded-lg border border-navy bg-navy/5 px-3 py-1.5 text-xs font-medium text-navy transition-colors hover:bg-navy/10"
                      >
                        리뷰 작성
                      </button>
                    )}

                    {/* Review Done Badge */}
                    {item.review && (
                      <div className="flex shrink-0 items-center gap-1 text-xs text-yellow-600">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span>{item.review.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-bold text-navy">리뷰 작성</h2>
              <button
                onClick={closeReviewModal}
                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5">
              {/* Expert Info */}
              <div className="mb-5 rounded-lg bg-gray-50 p-3">
                <p className="text-sm font-medium text-gray-700">{reviewTarget.expert.name}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {reviewTarget.expert.title} · {reviewTarget.subject}
                </p>
              </div>

              {/* Star Rating */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">평점</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-0.5 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= reviewRating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {reviewRating > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    {reviewRating === 1 && "별로예요"}
                    {reviewRating === 2 && "그저 그래요"}
                    {reviewRating === 3 && "보통이에요"}
                    {reviewRating === 4 && "좋아요"}
                    {reviewRating === 5 && "최고예요"}
                  </p>
                )}
              </div>

              {/* Content Textarea */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">리뷰 내용</label>
                <textarea
                  value={reviewContent}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      setReviewContent(e.target.value);
                    }
                  }}
                  placeholder="상담은 어떠셨나요? 다른 분들에게 도움이 될 수 있도록 솔직한 리뷰를 남겨주세요."
                  className="h-32 w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                />
                <p className="mt-1 text-right text-xs text-gray-400">
                  {reviewContent.length}/500
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
              <button
                onClick={closeReviewModal}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
              >
                취소
              </button>
              <button
                onClick={submitReview}
                disabled={submittingReview || reviewRating === 0 || !reviewContent.trim()}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submittingReview ? "등록 중..." : "리뷰 등록"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
