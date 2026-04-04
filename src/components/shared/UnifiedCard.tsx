"use client";

import Link from "next/link";
import Image from "next/image";
import TierBadge from "./TierBadge";

export interface UnifiedCardData {
  type: "listing" | "franchise" | "partner";
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  tier: string;
  tags: string[];
  stats: { label: string; value: string }[];
  viewCount?: number;
  favoriteCount?: number;
  createdAt?: string;
}

interface UnifiedCardProps {
  data: UnifiedCardData;
}

export default function UnifiedCard({ data }: UnifiedCardProps) {
  const linkPath =
    data.type === "listing" ? `/listings/${data.id}` :
    data.type === "franchise" ? `/franchise/${data.id}` :
    `/partners/${data.id}`;

  return (
    <Link
      href={linkPath}
      className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
    >
      {/* Image area with tier badge */}
      <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700">
        {data.imageUrl ? (
          <Image
            src={data.imageUrl}
            alt={data.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Tier badge overlay at top-right */}
        <div className="absolute top-2 right-2">
          <TierBadge tier={data.tier} size="sm" />
        </div>

        {/* Tags at top-left */}
        {data.tags.length > 0 && (
          <div className="absolute top-2 left-2 flex gap-1">
            {data.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-blue-600 dark:bg-blue-500 text-white text-xs font-medium rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate mb-1">
          {data.title}
        </h3>

        {/* Subtitle */}
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
          {data.subtitle}
        </p>

        {/* Stats grid (2 key-value pairs) */}
        {data.stats.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-2">
            {data.stats.slice(0, 2).map((stat, idx) => (
              <div key={idx} className="text-xs">
                <span className="text-gray-500 dark:text-gray-400">{stat.label} </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{stat.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer: viewCount/favoriteCount if available */}
        {(data.viewCount !== undefined || data.favoriteCount !== undefined) && (
          <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex gap-2">
              {data.viewCount !== undefined && <span>조회 {data.viewCount}</span>}
              {data.favoriteCount !== undefined && <span>관심 {data.favoriteCount}</span>}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
