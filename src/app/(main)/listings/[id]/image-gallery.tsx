"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, Camera } from "lucide-react";

interface ImageGalleryProps {
  images: { id: string; url: string }[];
  title: string;
  businessCategory?: string;
  showPhotoHint?: boolean;
}

/** 사진 순서 기반 카테고리 라벨 */
const IMAGE_CATEGORY_LABELS = [
  "외부전경", "내부전경", "주방", "화장실", "간판/외관",
  "홀/좌석", "주차장", "기타",
];

const CATEGORY_PLACEHOLDER: Record<string, { gradient: string; icon: string }> = {
  CAFE_BAKERY:   { gradient: "from-amber-800/70 to-amber-600/50", icon: "☕" },
  CHICKEN:       { gradient: "from-orange-600/70 to-orange-400/50", icon: "🍗" },
  KOREAN_FOOD:   { gradient: "from-red-700/70 to-red-500/50", icon: "🍚" },
  PIZZA:         { gradient: "from-yellow-600/70 to-yellow-400/50", icon: "🍕" },
  BUNSIK:        { gradient: "from-pink-600/70 to-pink-400/50", icon: "🍜" },
  RETAIL:        { gradient: "from-blue-700/70 to-blue-500/50", icon: "🏪" },
  BAR_PUB:       { gradient: "from-purple-700/70 to-purple-500/50", icon: "🍺" },
  WESTERN_FOOD:  { gradient: "from-rose-700/70 to-rose-500/50", icon: "🍝" },
  JAPANESE_FOOD: { gradient: "from-sky-700/70 to-sky-500/50", icon: "🍣" },
  CHINESE_FOOD:  { gradient: "from-red-800/70 to-red-600/50", icon: "🥟" },
  SERVICE:       { gradient: "from-blue-800/70 to-blue-600/50", icon: "✂️" },
  ENTERTAINMENT: { gradient: "from-indigo-700/70 to-indigo-500/50", icon: "🎮" },
  EDUCATION:     { gradient: "from-cyan-700/70 to-cyan-500/50", icon: "📚" },
  DELIVERY:      { gradient: "from-lime-700/70 to-lime-500/50", icon: "🛵" },
  ACCOMMODATION: { gradient: "from-stone-700/70 to-stone-500/50", icon: "🏨" },
};

/** CSS-only repeating diagonal watermark overlay */
function WatermarkOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden select-none"
      aria-hidden="true"
      style={{
        background: `repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 60px,
          rgba(255,255,255,0.08) 60px,
          rgba(255,255,255,0.08) 61px
        )`,
      }}
    >
      <div
        className="absolute inset-0 flex flex-wrap items-center justify-center gap-x-16 gap-y-10"
        style={{ transform: "rotate(-30deg) scale(1.5)", transformOrigin: "center center" }}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            className="whitespace-nowrap text-lg font-bold text-white select-none"
            style={{ opacity: 0.15 }}
          >
            권리샵
          </span>
        ))}
      </div>
    </div>
  );
}

export function ImageGallery({ images, title, businessCategory, showPhotoHint }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const lightboxOpen = lightboxIndex >= 0;

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(-1);
  }, []);

  const goLightbox = useCallback((dir: "prev" | "next") => {
    setLightboxIndex((prev) =>
      dir === "next"
        ? prev >= images.length - 1 ? 0 : prev + 1
        : prev <= 0 ? images.length - 1 : prev - 1
    );
  }, [images.length]);

  // Keyboard nav for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") goLightbox("prev");
      else if (e.key === "ArrowRight") goLightbox("next");
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightboxOpen, closeLightbox, goLightbox]);

  // Track active index via scroll position for dot indicators
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const cardWidth = 300; // approximate card width including gap
    const index = Math.round(scrollRef.current.scrollLeft / cardWidth);
    setActiveIndex(index);
  }, []);

  // 0 photos placeholder
  if (images.length === 0) {
    const cat = CATEGORY_PLACEHOLDER[businessCategory ?? ""] ?? { gradient: "from-gray-600/70 to-gray-400/50", icon: "🏠" };
    return (
      <div className={`relative flex h-[200px] items-center justify-center rounded-xl bg-gradient-to-br ${cat.gradient}`}>
        <div className="text-center">
          <span className="text-5xl drop-shadow-lg">{cat.icon}</span>
          <p className="mt-2 text-sm font-medium text-white/80">등록된 사진이 없습니다</p>
          {showPhotoHint && (
            <p className="mt-1 text-xs text-white/60">사진을 등록하면 문의율이 3배 높아집니다</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Horizontal scroll strip */}
      <div className="relative group">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-[200px] flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-2 rounded-xl"
        >
          {images.map((image, index) => (
            <div
              key={image.id}
              onClick={() => openLightbox(index)}
              className="relative h-[200px] w-[280px] md:w-[300px] flex-shrink-0 snap-start rounded-lg overflow-hidden cursor-pointer"
            >
              <Image
                src={image.url}
                alt={`${title} - ${index + 1}`}
                fill
                className="object-cover"
                priority={index === 0}
                sizes="300px"
              />
              <WatermarkOverlay />
              {/* Bottom overlay: category label + counter */}
              <div className="absolute bottom-0 inset-x-0 flex items-center justify-between bg-black/50 px-3 py-1 text-xs text-white">
                <span>{IMAGE_CATEGORY_LABELS[index] ?? `사진 ${index + 1}`}</span>
                <span className="text-white/70">{index + 1}/{images.length}</span>
              </div>
            </div>
          ))}

          {/* Last card - view all */}
          <div
            onClick={() => openLightbox(0)}
            className="flex items-center justify-center w-[280px] md:w-[300px] h-[200px] flex-shrink-0 snap-start rounded-lg bg-gray-100 cursor-pointer"
          >
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <Camera className="h-8 w-8" />
              <span className="text-sm font-medium">전체보기</span>
              <span className="text-xs text-gray-400">+{images.length}장</span>
            </div>
          </div>
        </div>

        {/* PC hover arrows */}
        <button
          type="button"
          onClick={() => scrollRef.current?.scrollBy({ left: -300, behavior: "smooth" })}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="이전"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" })}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="다음"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile dot indicators */}
      {images.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5 md:hidden">
          {images.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${
                i === activeIndex ? "bg-navy" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
        >
          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
            {lightboxIndex + 1} / {images.length}
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            aria-label="닫기"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Image */}
          <div onClick={(e) => e.stopPropagation()} className="relative">
            <Image
              src={images[lightboxIndex].url}
              alt={`${title} - ${lightboxIndex + 1}`}
              width={1200}
              height={800}
              className="max-h-[80vh] max-w-[90vw] object-contain"
              sizes="90vw"
            />
            <WatermarkOverlay />
          </div>

          {/* Left/right arrows */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goLightbox("prev"); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
                aria-label="이전 이미지"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goLightbox("next"); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
                aria-label="다음 이미지"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
