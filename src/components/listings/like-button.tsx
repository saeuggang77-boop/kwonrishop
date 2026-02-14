"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";

interface LikeButtonProps {
  listingId: string;
  initialLiked: boolean;
  initialCount: number;
}

export function LikeButton({ listingId, initialLiked, initialCount }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);

    // Optimistic update
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);

    try {
      const res = await fetch(`/api/listings/${listingId}/like`, { method: "POST" });
      if (res.status === 401) {
        // Revert and redirect
        setLiked(liked);
        setCount(count);
        router.push("/auth/login");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setLiked(data.liked);
        setCount(data.likeCount);
      }
    } catch {
      // Revert on error
      setLiked(liked);
      setCount(count);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-sm transition-colors"
      aria-label={liked ? "좋아요 취소" : "좋아요"}
    >
      <Heart
        className={`h-4 w-4 transition-colors ${
          liked ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-400"
        }`}
      />
      <span className={liked ? "text-red-500" : "text-gray-500"}>
        {count}
      </span>
    </button>
  );
}
