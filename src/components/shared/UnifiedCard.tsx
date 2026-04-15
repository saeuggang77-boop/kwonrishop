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

// B안 카드 시스템
//  · VIP/GOLD: 2px green-700 + cream-elev 배경 + terra-500 뱃지
//  · PREMIUM/SILVER: 1.5px line-deep + cream 배경 + green-700 뱃지
//  · 나머지: 1px line + cream + 연한 뱃지
export default function UnifiedCard({ data }: UnifiedCardProps) {
  const linkPath =
    data.type === "listing" ? `/listings/${data.id}` :
    data.type === "franchise" ? `/franchise/${data.id}` :
    `/partners/${data.id}`;

  const isTop = data.tier === "VIP" || data.tier === "GOLD";
  const isMid = data.tier === "PREMIUM" || data.tier === "SILVER";

  const cardClass = isTop
    ? "border-2 border-green-700 bg-cream-elev shadow-[0_8px_32px_rgba(31,63,46,0.10)] hover:shadow-[0_16px_40px_rgba(31,63,46,0.14)]"
    : isMid
      ? "border-[1.5px] border-line-deep bg-cream shadow-[0_2px_12px_rgba(31,63,46,0.06)] hover:shadow-[0_8px_24px_rgba(31,63,46,0.10)]"
      : "border border-line bg-cream hover:shadow-[0_4px_16px_rgba(31,63,46,0.08)]";

  return (
    <Link
      href={linkPath}
      className={`group block rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${cardClass}`}
    >
      {/* 이미지 영역 */}
      <div className={`relative aspect-[4/3] ${isTop ? "bg-green-800" : "bg-cream-elev"}`}>
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
          <div className={`w-full h-full flex items-center justify-center ${isTop ? "text-cream/40" : "text-line-deep"}`}>
            <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* 등급 뱃지 */}
        {data.tier && data.tier !== "FREE" && (
          <div className="absolute top-3 left-3">
            <span
              className={`inline-flex items-center gap-1 font-bold rounded-full tracking-wider ${
                isTop
                  ? "px-3 py-1.5 text-[11px] bg-terra-500 text-cream"
                  : isMid
                    ? "px-2.5 py-1 text-[10px] bg-green-700 text-cream"
                    : "px-2 py-0.5 text-[9px] bg-green-100 text-green-700"
              }`}
            >
              {data.tier}
            </span>
          </div>
        )}
      </div>

      {/* 본문 */}
      <div className="p-4">
        <h3 className="text-base font-bold text-ink truncate mb-1 tracking-tight">
          {data.title}
        </h3>
        <p className="text-sm text-muted truncate mb-3">
          {data.subtitle}
        </p>

        {data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {data.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-cream-elev text-green-700 text-[11px] rounded-full font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}

        {data.stats.length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-dashed border-line-deep">
            {data.stats.slice(0, 2).map((stat, idx) => (
              <div key={idx} className="text-xs">
                <div className="text-muted mb-0.5">{stat.label}</div>
                <div className="font-extrabold text-green-700 text-lg leading-tight tracking-tight">{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        {(data.viewCount !== undefined || data.favoriteCount !== undefined) && (
          <div className="flex items-center justify-between text-[11px] text-muted pt-3 mt-3 border-t border-line">
            <div className="flex gap-3">
              {data.viewCount !== undefined && <span>조회 {data.viewCount}</span>}
              {data.favoriteCount !== undefined && <span>관심 {data.favoriteCount}</span>}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
