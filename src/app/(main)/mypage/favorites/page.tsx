"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ListingCard from "@/components/listing/ListingCard";

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/mypage/favorites");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/mypage/favorites")
        .then((r) => r.json())
        .then((data) => { setFavorites(data); setLoading(false); });
    }
  }, [status, router]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">관심매물</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl aspect-[3/4] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        관심매물 <span className="text-blue-600">{favorites.length}</span>
      </h1>

      {favorites.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>관심매물이 없습니다</p>
          <p className="text-sm mt-1">매물 상세에서 하트를 눌러 저장하세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {favorites.map((listing) => (
            <ListingCard
              key={listing.id as string}
              listing={listing as Parameters<typeof ListingCard>[0]["listing"]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
