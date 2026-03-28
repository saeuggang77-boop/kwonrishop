"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "@/lib/toast";

interface Review {
  id: string;
  ratingAccuracy: number;
  ratingCommunication: number;
  ratingCondition: number;
  content: string;
  createdAt: string;
  user: {
    name: string | null;
    image: string | null;
  };
}

interface ReviewSectionProps {
  listingId: string;
}

export default function ReviewSection({ listingId }: ReviewSectionProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    ratingAccuracy: 5,
    ratingCommunication: 5,
    ratingCondition: 5,
    content: "",
  });

  useEffect(() => {
    fetchReviews();
  }, [listingId]);

  async function fetchReviews() {
    try {
      const res = await fetch(`/api/reviews?listingId=${listingId}`);
      const data = await res.json();
      setReviews(data.reviews || []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch reviews", err);
      setLoading(false);
    }
  }

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
          ...formData,
        }),
      });

      if (res.ok) {
        setFormData({
          ratingAccuracy: 5,
          ratingCommunication: 5,
          ratingCondition: 5,
          content: "",
        });
        setShowForm(false);
        fetchReviews();
      } else {
        const data = await res.json();
        toast.error(data.error || "리뷰 작성에 실패했습니다.");
      }
    } catch (err) {
      toast.error("오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  function StarRating({ rating, onChange, readonly = false }: { rating: number; onChange?: (r: number) => void; readonly?: boolean }) {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !readonly && onChange?.(star)}
            className={`text-xl ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            }`}
            disabled={readonly}
          >
            ★
          </button>
        ))}
      </div>
    );
  }

  const avgAccuracy = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.ratingAccuracy, 0) / reviews.length : 0;
  const avgCommunication = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.ratingCommunication, 0) / reviews.length : 0;
  const avgCondition = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.ratingCondition, 0) / reviews.length : 0;
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
        <h2 className="font-bold text-gray-900">리뷰 ({reviews.length})</h2>
        {session && !showForm && (
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
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl font-bold text-gray-900">{avgOverall.toFixed(1)}</span>
            <StarRating rating={Math.round(avgOverall)} readonly />
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-gray-500 mb-1">정확성</p>
              <div className="flex items-center gap-1">
                <StarRating rating={Math.round(avgAccuracy)} readonly />
                <span className="text-gray-700 ml-1">{avgAccuracy.toFixed(1)}</span>
              </div>
            </div>
            <div>
              <p className="text-gray-500 mb-1">소통</p>
              <div className="flex items-center gap-1">
                <StarRating rating={Math.round(avgCommunication)} readonly />
                <span className="text-gray-700 ml-1">{avgCommunication.toFixed(1)}</span>
              </div>
            </div>
            <div>
              <p className="text-gray-500 mb-1">상태</p>
              <div className="flex items-center gap-1">
                <StarRating rating={Math.round(avgCondition)} readonly />
                <span className="text-gray-700 ml-1">{avgCondition.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-100">
          <h3 className="font-bold text-gray-900 mb-3">리뷰 작성</h3>

          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">정확성</label>
              <StarRating rating={formData.ratingAccuracy} onChange={(r) => setFormData({ ...formData, ratingAccuracy: r })} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">소통</label>
              <StarRating rating={formData.ratingCommunication} onChange={(r) => setFormData({ ...formData, ratingCommunication: r })} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">상태</label>
              <StarRating rating={formData.ratingCondition} onChange={(r) => setFormData({ ...formData, ratingCondition: r })} />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-700 mb-1">상세 리뷰</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="이 매물에 대한 경험을 공유해주세요"
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
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
        <p className="text-sm text-gray-400 text-center py-6">아직 리뷰가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
              <div className="flex items-center gap-3 mb-2">
                {review.user.image ? (
                  <Image src={review.user.image} alt="" width={32} height={32} className="rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-bold">
                    {review.user.name?.[0] || "U"}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{review.user.name || "사용자"}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                <div>
                  <span className="text-gray-500">정확성: </span>
                  <StarRating rating={review.ratingAccuracy} readonly />
                </div>
                <div>
                  <span className="text-gray-500">소통: </span>
                  <StarRating rating={review.ratingCommunication} readonly />
                </div>
                <div>
                  <span className="text-gray-500">상태: </span>
                  <StarRating rating={review.ratingCondition} readonly />
                </div>
              </div>

              <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
