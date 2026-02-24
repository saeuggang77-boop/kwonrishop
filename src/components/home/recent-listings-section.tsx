"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";
import { useRecentListings, type RecentListing } from "@/hooks/use-recent-listings";
import { formatKRW } from "@/lib/utils/format";

export function RecentListingsSection() {
  const { recents } = useRecentListings();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || recents.length === 0) {
    return null;
  }

  // Show max 6 items
  const displayItems = recents.slice(0, 6);

  return (
    <section className="bg-white py-10 md:py-16">
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-gray-500 md:h-5 md:w-5" />
          <h2 className="font-heading text-base font-bold text-navy md:text-xl">
            최근 본 매물
          </h2>
        </div>

        {/* Horizontal scroll carousel */}
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
          {displayItems.map((item) => (
            <RecentListingCard key={item.id} listing={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RecentListingCard({ listing }: { listing: RecentListing }) {
  const price = listing.price ? Number(listing.price) : 0;
  const premiumFee = listing.premiumFee ? Number(listing.premiumFee) : 0;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex-none w-[160px] overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md snap-start md:w-[180px]"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-100">
        {listing.image ? (
          <Image
            src={listing.image}
            alt={listing.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="180px"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-xs text-gray-400">이미지 없음</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <p className="truncate text-sm font-semibold text-gray-800 group-hover:text-purple-600">
          {listing.title}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {listing.city} {listing.district}
        </p>
        <div className="mt-2 flex flex-col gap-0.5">
          <span className="text-sm font-bold text-purple-600">
            {premiumFee > 0 ? formatKRW(premiumFee) : "무권리"}
          </span>
          <span className="text-xs text-gray-400">
            보증금 {formatKRW(price)}
          </span>
        </div>
      </div>
    </Link>
  );
}
