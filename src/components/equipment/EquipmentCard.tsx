"use client";

import Link from "next/link";
import Image from "next/image";
import { EQUIPMENT_CATEGORY_LABELS, EQUIPMENT_CONDITION_LABELS, TRADE_METHOD_LABELS } from "@/lib/constants";

interface EquipmentCardProps {
  equipment: {
    id: string;
    title: string;
    price: number;
    negotiable: boolean;
    condition: string;
    category: string;
    tradeMethod: string;
    addressRoad: string | null;
    addressJibun: string | null;
    viewCount: number;
    favoriteCount: number;
    images: { url: string }[];
  };
}

export default function EquipmentCard({ equipment }: EquipmentCardProps) {
  const address = equipment.addressRoad || equipment.addressJibun || "주소 미입력";
  const shortAddress = address.split(" ").slice(0, 3).join(" ");

  const isFree = equipment.price === 0;

  const conditionColors: Record<string, string> = {
    EXCELLENT: "bg-green-500 text-white",
    GOOD: "bg-navy-500 text-white",
    FAIR: "bg-red-500 text-white",
  };

  function formatPrice(price: number): string {
    if (price === 0) return "무료 나눔";
    if (price >= 10000) {
      const man = Math.floor(price / 10000);
      const remainder = price % 10000;
      return remainder > 0
        ? `${man.toLocaleString()}만 ${remainder.toLocaleString()}원`
        : `${man.toLocaleString()}만원`;
    }
    return `${price.toLocaleString()}원`;
  }

  return (
    <Link href={`/equipment/${equipment.id}`}>
      <div className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        {/* 이미지 */}
        <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700">
          {equipment.images[0] ? (
            <Image
              src={equipment.images[0].url}
              alt={equipment.title}
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

          {/* 나눔 배지 */}
          {isFree && (
            <div className="absolute top-2 left-2">
              <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded">
                나눔
              </span>
            </div>
          )}

          {/* 상태 배지 */}
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${conditionColors[equipment.condition] || "bg-gray-500 text-white"}`}>
              {EQUIPMENT_CONDITION_LABELS[equipment.condition] || equipment.condition}
            </span>
          </div>
        </div>

        {/* 정보 */}
        <div className="p-3">
          <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mb-1">
            <span>{EQUIPMENT_CATEGORY_LABELS[equipment.category] || equipment.category}</span>
            <span>·</span>
            <span>{TRADE_METHOD_LABELS[equipment.tradeMethod] || equipment.tradeMethod}</span>
          </div>

          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
            {equipment.title}
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1">{shortAddress}</p>

          {/* 가격 */}
          <div className="space-y-0.5">
            <p className="text-sm">
              <span className={`font-bold ${isFree ? "text-green-600 dark:text-green-400" : "text-navy-700 dark:text-navy-400"}`}>
                {formatPrice(equipment.price)}
              </span>
              {equipment.negotiable && !isFree && (
                <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">협의가능</span>
              )}
            </p>
          </div>

          {/* 메타 */}
          <div className="flex items-center justify-end mt-2 text-xs text-gray-400 dark:text-gray-500">
            <div className="flex gap-2">
              <span className="flex items-center gap-0.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {equipment.viewCount}
              </span>
              <span className="flex items-center gap-0.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {equipment.favoriteCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
