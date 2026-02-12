"use client";

import { useState, useEffect, useCallback, useRef, type FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
  Star,
  MapPin,
  Shield,
  User,
  MessageSquare,
  Briefcase,
  CheckCircle,
  X,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { formatNumber, formatDateKR } from "@/lib/utils/format";
import {
  EXPERT_CATEGORY_LABELS,
  EXPERT_CATEGORY_COLORS,
  EXPERT_INQUIRY_CATEGORIES,
} from "@/lib/utils/constants";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ExpertDetail {
  id: string;
  name: string;
  title: string | null;
  company: string | null;
  category: string;
  region: string | null;
  profileImage: string | null;
  specialties: string[];
  description: string | null;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  consultationCount: number;
  isVerified: boolean;
}

interface ReviewItem {
  id: string;
  rating: number;
  content: string;
  reviewerName: string;
  createdAt: string;
}

interface ReviewsResponse {
  reviews: ReviewItem[];
  total: number;
  page: number;
  hasMore: boolean;
}

interface UserListing {
  id: string;
  title: string;
}

/* ------------------------------------------------------------------ */
/*  Star Rating                                                        */
/* ------------------------------------------------------------------ */

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(
        <Star
          key={i}
          size={size}
          className="fill-yellow-400 text-yellow-400"
        />
      );
    } else if (i === fullStars && hasHalf) {
      stars.push(
        <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
          <Star size={size} className="absolute text-gray-300" />
          <span className="absolute overflow-hidden" style={{ width: size / 2 }}>
            <Star size={size} className="fill-yellow-400 text-yellow-400" />
          </span>
        </span>
      );
    } else {
      stars.push(
        <Star key={i} size={size} className="text-gray-300" />
      );
    }
  }

  return <span className="inline-flex items-center gap-0.5">{stars}</span>;
}

/* ------------------------------------------------------------------ */
/*  Mask reviewer name (김*훈)                                         */
/* ------------------------------------------------------------------ */

function maskName(name: string): string {
  if (!name) return "익명";
  if (name.length <= 1) return name;
  if (name.length === 2) return name[0] + "*";
  return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */

function ProfileSkeleton() {
  return (
    <div className="min-h-screen animate-pulse bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center gap-5">
          <div className="h-24 w-24 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-32 rounded bg-gray-200" />
            <div className="h-4 w-48 rounded bg-gray-200" />
            <div className="h-4 w-24 rounded bg-gray-200" />
          </div>
        </div>
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-200" />
          ))}
        </div>
        <div className="mt-8 space-y-3">
          <div className="h-5 w-28 rounded bg-gray-200" />
          <div className="h-20 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Consultation Modal                                                 */
/* ------------------------------------------------------------------ */

function ConsultationModal({
  expert,
  onClose,
}: {
  expert: ExpertDetail;
  onClose: () => void;
}) {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [inquiryCategory, setInquiryCategory] = useState("");
  const [listingId, setListingId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userListings, setUserListings] = useState<UserListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);

  const backdropRef = useRef<HTMLDivElement>(null);

  // Fetch user listings if logged in
  useEffect(() => {
    if (!session?.user) return;
    setListingsLoading(true);
    fetch("/api/listings?limit=50&mine=true")
      .then((res) => {
        if (!res.ok) return { listings: [] };
        return res.json();
      })
      .then((data) => {
        setUserListings(
          (data.listings ?? []).map((l: { id: string; title: string }) => ({
            id: l.id,
            title: l.title,
          }))
        );
      })
      .catch(() => setUserListings([]))
      .finally(() => setListingsLoading(false));
  }, [session]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;

    if (!inquiryCategory) {
      toast("error", "상담 카테고리를 선택해주세요");
      return;
    }
    if (!title.trim()) {
      toast("error", "제목을 입력해주세요");
      return;
    }
    if (!content.trim()) {
      toast("error", "상담 내용을 입력해주세요");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/expert-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expertId: expert.id,
          category: inquiryCategory,
          listingId: listingId || undefined,
          title: title.trim(),
          content: content.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "상담 신청에 실패했습니다" }));
        throw new Error(err.error || "상담 신청에 실패했습니다");
      }

      toast("success", "상담이 신청되었습니다. 전문가의 답변을 기다려주세요.");
      onClose();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "상담 신청에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm md:items-center"
    >
      <div className="w-full max-w-lg animate-slide-up rounded-t-2xl bg-white p-6 shadow-2xl md:rounded-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">상담 신청하기</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Not logged in */}
        {!session?.user ? (
          <div className="py-8 text-center">
            <User className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-600">
              로그인이 필요합니다
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block rounded-lg bg-mint px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-mint-dark"
            >
              로그인하기
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Inquiry Category */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                상담 카테고리 <span className="text-red-500">*</span>
              </label>
              <select
                value={inquiryCategory}
                onChange={(e) => setInquiryCategory(e.target.value)}
                className="input-field"
              >
                <option value="">카테고리 선택</option>
                {EXPERT_INQUIRY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Related Listing */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                관련 매물 <span className="text-xs text-gray-400">(선택)</span>
              </label>
              {listingsLoading ? (
                <div className="flex items-center gap-2 py-2 text-sm text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  매물 목록 불러오는 중...
                </div>
              ) : (
                <select
                  value={listingId}
                  onChange={(e) => setListingId(e.target.value)}
                  className="input-field"
                >
                  <option value="">매물 선택 (선택사항)</option>
                  {userListings.map((listing) => (
                    <option key={listing.id} value={listing.id}>
                      {listing.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                placeholder="상담 제목을 입력하세요"
                maxLength={100}
                className="input-field"
              />
              <p className="mt-1 text-right text-xs text-gray-400">
                {title.length}/100
              </p>
            </div>

            {/* Content */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                상담 내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, 2000))}
                placeholder="상담 내용을 자세히 작성해주세요"
                rows={5}
                maxLength={2000}
                className="input-field resize-none"
              />
              <p className="mt-1 text-right text-xs text-gray-400">
                {content.length}/2,000
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-mint py-3 text-sm font-semibold text-white transition-colors hover:bg-mint-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  신청 중...
                </span>
              ) : (
                "상담 신청하기"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Review Card                                                        */
/* ------------------------------------------------------------------ */

function ReviewCard({ review }: { review: ReviewItem }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <StarRating rating={review.rating} size={14} />
        <span className="text-xs text-gray-400">
          {formatDateKR(review.createdAt)}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-gray-700">
        {review.content}
      </p>
      <p className="mt-2 text-xs text-gray-400">
        {maskName(review.reviewerName)}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function ExpertDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [expert, setExpert] = useState<ExpertDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewHasMore, setReviewHasMore] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsLoadingMore, setReviewsLoadingMore] = useState(false);

  const [showModal, setShowModal] = useState(false);

  // Fetch expert detail
  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    fetch(`/api/experts/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("전문가 정보를 불러올 수 없습니다");
        return res.json();
      })
      .then((data) => setExpert(data))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [id]);

  // Fetch reviews
  const fetchReviews = useCallback(
    async (pageNum: number, reset = false) => {
      if (!id) return;
      if (reset) {
        setReviewsLoading(true);
      } else {
        setReviewsLoadingMore(true);
      }

      try {
        const res = await fetch(
          `/api/experts/${id}/reviews?page=${pageNum}&limit=5`
        );
        if (!res.ok) throw new Error("리뷰를 불러올 수 없습니다");
        const data: ReviewsResponse = await res.json();

        if (reset) {
          setReviews(data.reviews);
        } else {
          setReviews((prev) => [...prev, ...data.reviews]);
        }
        setReviewTotal(data.total);
        setReviewHasMore(data.hasMore);
        setReviewPage(pageNum);
      } catch {
        if (reset) setReviews([]);
      } finally {
        setReviewsLoading(false);
        setReviewsLoadingMore(false);
      }
    },
    [id]
  );

  useEffect(() => {
    fetchReviews(1, true);
  }, [fetchReviews]);

  // Loading state
  if (isLoading) return <ProfileSkeleton />;

  // Error state
  if (error || !expert) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-600">
            {error ?? "전문가를 찾을 수 없습니다"}
          </p>
          <Link
            href="/experts"
            className="mt-4 inline-block rounded-lg bg-mint px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-mint-dark"
          >
            전문가 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const categoryColor =
    EXPERT_CATEGORY_COLORS[expert.category] ?? { bg: "bg-gray-100", text: "text-gray-600" };
  const categoryLabel =
    EXPERT_CATEGORY_LABELS[expert.category] ?? expert.category;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* Back nav */}
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <Link
          href="/experts"
          className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-navy"
        >
          <ChevronLeft className="h-4 w-4" />
          전문가 목록
        </Link>
      </div>

      {/* Profile Header */}
      <section className="mx-auto max-w-3xl px-4 py-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            {/* Profile Image */}
            <div className="relative h-28 w-28 shrink-0">
              {expert.profileImage ? (
                <Image
                  src={expert.profileImage}
                  alt={expert.name}
                  fill
                  className="rounded-full object-cover"
                  sizes="112px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-100">
                  <User className="h-14 w-14 text-gray-400" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-2xl font-bold text-navy">{expert.name}</h1>
                {expert.isVerified && (
                  <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">
                    <CheckCircle className="h-3.5 w-3.5" />
                    인증됨
                  </span>
                )}
              </div>
              {expert.title && (
                <p className="mt-1 text-sm text-gray-500">{expert.title}</p>
              )}
              {expert.company && (
                <p className="mt-0.5 text-sm text-gray-600">{expert.company}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${categoryColor.bg} ${categoryColor.text}`}
                >
                  {categoryLabel}
                </span>
                {expert.region && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {expert.region}
                  </span>
                )}
              </div>

              {/* Desktop CTA */}
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 hidden rounded-lg bg-mint px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-mint-dark sm:inline-block"
              >
                상담 신청하기
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="mx-auto max-w-3xl px-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="text-xl font-bold text-navy">
                {expert.rating.toFixed(1)}
              </span>
            </div>
            <span className="mt-1 text-xs text-gray-500">평점</span>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-4">
            <span className="text-xl font-bold text-navy">
              {formatNumber(expert.consultationCount)}건
            </span>
            <span className="mt-1 text-xs text-gray-500">상담 건수</span>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-4">
            <span className="text-xl font-bold text-navy">
              {expert.experienceYears}년
            </span>
            <span className="mt-1 text-xs text-gray-500">경력</span>
          </div>
        </div>
      </section>

      {/* Description Section */}
      <section className="mx-auto mt-6 max-w-3xl px-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold text-navy">전문가 소개</h2>
          {expert.description ? (
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-700">
              {expert.description}
            </p>
          ) : (
            <p className="mt-3 text-sm text-gray-400">
              소개글이 등록되지 않았습니다.
            </p>
          )}

          {/* Specialties */}
          {expert.specialties.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-600">전문 분야</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {expert.specialties.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Reviews Section */}
      <section className="mx-auto mt-6 max-w-3xl px-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy">
              상담 후기{" "}
              <span className="text-sm font-normal text-gray-400">
                ({formatNumber(reviewTotal)})
              </span>
            </h2>
          </div>

          {reviewsLoading ? (
            <div className="mt-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl border border-gray-200 p-4"
                >
                  <div className="h-4 w-24 rounded bg-gray-200" />
                  <div className="mt-3 h-12 rounded bg-gray-200" />
                  <div className="mt-2 h-3 w-16 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : reviews.length > 0 ? (
            <>
              <div className="mt-4 space-y-3">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>

              {reviewHasMore && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => fetchReviews(reviewPage + 1, false)}
                    disabled={reviewsLoadingMore}
                    className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {reviewsLoadingMore ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        불러오는 중...
                      </span>
                    ) : (
                      "더보기"
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="mt-6 py-8 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-2 text-sm text-gray-400">
                아직 등록된 후기가 없습니다
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Fixed Bottom CTA (mobile) */}
      <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-gray-200 bg-white px-4 py-3 md:hidden">
        <button
          onClick={() => setShowModal(true)}
          className="w-full rounded-lg bg-mint py-3.5 text-base font-semibold text-white transition-colors hover:bg-mint-dark"
        >
          상담 신청하기
        </button>
      </div>

      {/* Consultation Modal */}
      {showModal && (
        <ConsultationModal
          expert={expert}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
