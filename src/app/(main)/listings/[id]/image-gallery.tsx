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

export function ImageGallery({ images, title, businessCategory, showPhotoHint }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [imgLoaded, setImgLoaded] = useState<Record<number, boolean>>({});
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const carouselRef = useRef<HTMLDivElement>(null);

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

  // Mobile swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) setMobileIndex((p) => Math.min(p + 1, images.length - 1));
    else if (diff < -50) setMobileIndex((p) => Math.max(p - 1, 0));
  };

  // Scroll carousel on mobile index change
  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ left: mobileIndex * carouselRef.current.offsetWidth, behavior: "smooth" });
    }
  }, [mobileIndex]);

  const onLoad = (i: number) => setImgLoaded((prev) => ({ ...prev, [i]: true }));

  // Skeleton placeholder
  const Skeleton = () => (
    <div className="absolute inset-0 animate-pulse bg-gray-200" />
  );

  // Gray placeholder for missing slots
  const Placeholder = () => (
    <div className="flex h-full w-full items-center justify-center bg-gray-100">
      <Camera className="h-8 w-8 text-gray-300" />
    </div>
  );

  // ── No images ──
  if (images.length === 0) {
    const cat = CATEGORY_PLACEHOLDER[businessCategory ?? ""] ?? { gradient: "from-gray-600/70 to-gray-400/50", icon: "🏠" };
    return (
      <div className={`relative flex h-[300px] items-center justify-center rounded-xl bg-gradient-to-br ${cat.gradient}`}>
        <div className="text-center">
          <span className="text-7xl drop-shadow-lg">{cat.icon}</span>
          <p className="mt-3 text-sm font-medium text-white/80">등록된 사진이 없습니다</p>
        </div>
        {showPhotoHint && (
          <div className="absolute bottom-0 left-0 right-0 rounded-b-xl bg-black/40 px-4 py-3 text-center backdrop-blur-sm">
            <p className="text-sm font-medium text-white">📸 사진을 등록하면 문의율이 3배 높아집니다</p>
          </div>
        )}
      </div>
    );
  }

  const extraCount = images.length - 3;

  return (
    <>
      {/* ── Desktop Grid (md+) ── */}
      <div className="hidden md:block">
        <div className="h-[400px] gap-2" style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gridTemplateRows: "1fr 1fr" }}>
          {/* Main image - spans 2 rows */}
          <button
            type="button"
            onClick={() => openLightbox(0)}
            className="relative row-span-2 overflow-hidden rounded-lg"
          >
            {!imgLoaded[0] && <Skeleton />}
            <Image
              src={images[0].url}
              alt={`${title} - 1`}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
              priority
              sizes="(min-width: 768px) 60vw, 100vw"
              onLoad={() => onLoad(0)}
            />
          </button>

          {/* Top-right */}
          <button
            type="button"
            onClick={() => images.length > 1 ? openLightbox(1) : openLightbox(0)}
            className="relative overflow-hidden rounded-lg"
          >
            {images.length > 1 ? (
              <>
                {!imgLoaded[1] && <Skeleton />}
                <Image
                  src={images[1].url}
                  alt={`${title} - 2`}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  sizes="(min-width: 768px) 40vw, 100vw"
                  onLoad={() => onLoad(1)}
                />
              </>
            ) : (
              <Placeholder />
            )}
          </button>

          {/* Bottom-right */}
          <button
            type="button"
            onClick={() => images.length > 2 ? openLightbox(2) : openLightbox(0)}
            className="relative overflow-hidden rounded-lg"
          >
            {images.length > 2 ? (
              <>
                {!imgLoaded[2] && <Skeleton />}
                <Image
                  src={images[2].url}
                  alt={`${title} - 3`}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  sizes="(min-width: 768px) 40vw, 100vw"
                  onLoad={() => onLoad(2)}
                />
                {/* "전체보기 +N장" overlay */}
                {extraCount > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors hover:bg-black/50">
                    <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-gray-900">
                      전체보기 +{extraCount}장
                    </span>
                  </div>
                )}
              </>
            ) : (
              <Placeholder />
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile Carousel (< md) ── */}
      <div className="md:hidden">
        <div
          ref={carouselRef}
          className="relative flex h-[250px] snap-x snap-mandatory overflow-x-auto rounded-xl scrollbar-hide"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => openLightbox(index)}
              className="relative h-full w-full shrink-0 snap-center"
            >
              {!imgLoaded[index] && <Skeleton />}
              <Image
                src={image.url}
                alt={`${title} - ${index + 1}`}
                fill
                className="object-cover"
                priority={index === 0}
                sizes="100vw"
                onLoad={() => onLoad(index)}
              />
            </button>
          ))}
        </div>
        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="mt-2 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setMobileIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === mobileIndex ? "w-5 bg-navy" : "w-2 bg-gray-300"
                }`}
                aria-label={`사진 ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox Modal ── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            aria-label="닫기"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
            {lightboxIndex + 1} / {images.length}
          </div>

          {/* Image */}
          <div
            className="relative h-[80vh] w-[90vw] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[lightboxIndex].url}
              alt={`${title} - ${lightboxIndex + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>

          {/* Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goLightbox("prev"); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
                aria-label="이전 이미지"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goLightbox("next"); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
                aria-label="다음 이미지"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 overflow-x-auto rounded-xl bg-black/40 p-2 backdrop-blur-sm">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(index); }}
                  className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                    index === lightboxIndex ? "border-white" : "border-transparent opacity-50 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={image.url}
                    alt={`썸네일 ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
