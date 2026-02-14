"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin, Eye, Store } from "lucide-react";
import { formatKRW } from "@/lib/utils/format";
import { BUSINESS_CATEGORY_LABELS } from "@/lib/utils/constants";

interface LikedListing {
  id: string;
  title: string;
  city: string;
  district: string;
  businessCategory: string;
  price: number;
  premiumFee: number;
  viewCount: number;
  likeCount: number;
  thumbnailUrl: string | null;
}

const CATEGORY_PLACEHOLDER: Record<string, { gradient: string; icon: string }> = {
  CAFE_BAKERY:   { gradient: "from-amber-800/70 to-amber-600/50", icon: "☕" },
  CHICKEN:       { gradient: "from-orange-600/70 to-orange-400/50", icon: "🍗" },
  KOREAN_FOOD:   { gradient: "from-red-700/70 to-red-500/50", icon: "🍚" },
  PIZZA:         { gradient: "from-yellow-600/70 to-yellow-400/50", icon: "🍕" },
  BUNSIK:        { gradient: "from-pink-600/70 to-pink-400/50", icon: "🍜" },
  RETAIL:        { gradient: "from-blue-700/70 to-blue-500/50", icon: "🏪" },
  BAR_PUB:       { gradient: "from-purple-700/70 to-purple-500/50", icon: "🍺" },
  WESTERN_FOOD:  { gradient: "from-rose-700/70 to-rose-500/50", icon: "🍝" },
  SERVICE:       { gradient: "from-blue-800/70 to-blue-600/50", icon: "✂️" },
  ENTERTAINMENT: { gradient: "from-indigo-700/70 to-indigo-500/50", icon: "🎮" },
  EDUCATION:     { gradient: "from-cyan-700/70 to-cyan-500/50", icon: "📚" },
  CHINESE_FOOD:  { gradient: "from-red-600/70 to-red-400/50", icon: "🥟" },
  JAPANESE_FOOD: { gradient: "from-sky-700/70 to-sky-500/50", icon: "🍣" },
  DELIVERY:      { gradient: "from-green-600/70 to-green-400/50", icon: "🛵" },
  ACCOMMODATION: { gradient: "from-teal-700/70 to-teal-500/50", icon: "🏨" },
  OTHER_FOOD:    { gradient: "from-stone-600/70 to-stone-400/50", icon: "🍴" },
  OTHER:         { gradient: "from-gray-600/70 to-gray-400/50", icon: "🏠" },
};

export default function MyLikesPage() {
  const [listings, setListings] = useState<LikedListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/my/likes")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setListings(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B3B57]">찜한 매물</h1>
          <p className="mt-1 text-sm text-gray-500">좋아요한 매물을 확인하세요</p>
        </div>
        <Link
          href="/listings"
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-dark"
        >
          매물 둘러보기
        </Link>
      </div>

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-xl bg-gray-100">
              <div className="h-40 bg-gray-200" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-200" />
                <div className="h-3 w-2/3 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="mt-20 text-center">
          <Heart className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-600">아직 찜한 매물이 없습니다</h3>
          <p className="mt-2 text-sm text-gray-500">마음에 드는 매물에 좋아요를 눌러보세요</p>
          <Link
            href="/listings"
            className="mt-6 inline-block rounded-lg bg-[#0B3B57] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#0B3B57]/90"
          >
            매물 목록 보기
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => {
            const categoryLabel =
              BUSINESS_CATEGORY_LABELS[listing.businessCategory] ?? listing.businessCategory;
            const cat = CATEGORY_PLACEHOLDER[listing.businessCategory] ?? {
              gradient: "from-gray-600/70 to-gray-400/50",
              icon: "🏠",
            };

            return (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
              >
                {/* Thumbnail */}
                <div className="relative h-40 w-full overflow-hidden bg-gray-100">
                  {listing.thumbnailUrl ? (
                    <Image
                      src={listing.thumbnailUrl}
                      alt={listing.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className={`flex h-full items-center justify-center bg-gradient-to-br ${cat.gradient}`}
                    >
                      <span className="text-5xl drop-shadow-lg">{cat.icon}</span>
                    </div>
                  )}
                  <span className="absolute left-2 top-2 rounded bg-[#0B3B57]/80 px-2 py-0.5 text-[11px] font-medium leading-tight text-white">
                    {categoryLabel}
                  </span>
                </div>

                {/* Card body */}
                <div className="p-4">
                  <h3 className="truncate text-sm font-semibold text-gray-900 group-hover:text-[#0B3B57]">
                    {listing.title}
                  </h3>

                  <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {listing.city} {listing.district}
                    </span>
                  </div>

                  <div className="mt-2 space-y-0.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">권리금</span>
                      <span className="font-bold text-[#0B3B57]">
                        {formatKRW(listing.premiumFee)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">총투자비</span>
                      <span className="font-medium text-gray-700">
                        {formatKRW(listing.price)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-2 text-xs text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {listing.viewCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Heart className="h-3 w-3 fill-red-400 text-red-400" />
                      {listing.likeCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Store className="h-3 w-3" />
                      {categoryLabel}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
