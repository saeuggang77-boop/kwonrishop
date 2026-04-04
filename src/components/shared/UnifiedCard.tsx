"use client";

import Link from "next/link";
import Image from "next/image";

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
      className={`block bg-white dark:bg-gray-800 rounded-xl overflow-hidden hover:-translate-y-1 transition-all duration-300 ${
        data.tier === "VIP"
          ? "border-2 border-navy-600 shadow-[0_4px_16px_rgba(27,73,101,0.15)] hover:shadow-[0_8px_28px_rgba(27,73,101,0.25)]"
          : data.tier === "PREMIUM"
            ? "border-[1.5px] border-navy-300 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)]"
            : "border border-gray-200 dark:border-gray-700 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
      }`}
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

        {/* Tier badge overlay at top-left */}
        {data.tier && data.tier !== "FREE" && (
          <div className="absolute top-2 left-2">
            <span className={`inline-flex items-center gap-1 font-bold rounded ${
              data.tier === "VIP" || data.tier === "GOLD"
                ? "px-3 py-1.5 text-[11px] bg-navy-700 text-white shadow-[0_2px_8px_rgba(27,73,101,0.3)]"
                : data.tier === "PREMIUM" || data.tier === "SILVER"
                  ? "px-2.5 py-1 text-[10px] bg-navy-700/85 text-white backdrop-blur-sm"
                  : "px-2 py-0.5 text-[9px] bg-white/85 text-gray-500 dark:bg-gray-800/85 dark:text-gray-400 backdrop-blur-sm"
            }`}>
              {(data.tier === "VIP" || data.tier === "GOLD") && (
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              )}
              {data.tier}
            </span>
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

        {/* Tags */}
        {data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {data.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-[10px] rounded">
                {tag}
              </span>
            ))}
          </div>
        )}

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
