"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handlePrevious = useCallback(() => {
    setDirection("left");
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setDirection("right");
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (diff > threshold) handleNext();
    else if (diff < -threshold) handlePrevious();
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      else if (e.key === "ArrowLeft") handlePrevious();
      else if (e.key === "ArrowRight") handleNext();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxOpen, handlePrevious, handleNext]);

  if (images.length === 0) {
    const cat = CATEGORY_PLACEHOLDER[businessCategory ?? ""] ?? { gradient: "from-gray-600/70 to-gray-400/50", icon: "🏠" };
    return (
      <div className={`relative flex aspect-[16/9] items-center justify-center rounded-xl bg-gradient-to-br ${cat.gradient}`}>
        <div className="text-center">
          <span className="text-8xl drop-shadow-lg">{cat.icon}</span>
          <p className="mt-4 text-sm font-medium text-white/80">등록된 사진이 없습니다</p>
        </div>
        {showPhotoHint && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-4 py-3 text-center backdrop-blur-sm">
            <p className="text-sm font-medium text-white">📸 사진을 등록하면 문의율이 3배 높아집니다</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-xl bg-gray-900">
        {/* Main Image with crossfade */}
        <div
          className="group relative aspect-[16/9] cursor-pointer"
          onClick={() => setLightboxOpen(true)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {images.map((image, index) => (
            <div
              key={image.id}
              className="absolute inset-0 transition-all duration-500 ease-in-out"
              style={{
                opacity: index === currentIndex ? 1 : 0,
                transform:
                  index === currentIndex
                    ? "translateX(0) scale(1)"
                    : direction === "right"
                      ? "translateX(30px) scale(0.98)"
                      : "translateX(-30px) scale(0.98)",
                pointerEvents: index === currentIndex ? "auto" : "none",
              }}
            >
              <Image
                src={image.url}
                alt={`${title} - ${index + 1}`}
                fill
                className="object-contain"
                priority={index === 0}
                sizes="(max-width: 768px) 100vw, 1200px"
              />
            </div>
          ))}

          {/* Zoom hint */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/10 group-hover:opacity-100">
            <span className="flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-sm text-white backdrop-blur-sm">
              <ZoomIn className="h-4 w-4" />
              클릭하여 확대
            </span>
          </div>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/50"
                aria-label="이전 이미지"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/50"
                aria-label="다음 이미지"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-sm text-white backdrop-blur-sm">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto bg-black/40 p-4 scrollbar-hide">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => {
                  setDirection(index > currentIndex ? "right" : "left");
                  setCurrentIndex(index);
                }}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                  index === currentIndex
                    ? "scale-105 border-navy"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
                aria-label={`이미지 ${index + 1}번 보기`}
              >
                <Image
                  src={image.url}
                  alt={`썸네일 ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            aria-label="닫기"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white backdrop-blur-sm">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Image */}
          <div
            className="relative h-[80vh] w-[90vw] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[currentIndex].url}
              alt={`${title} - ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
                aria-label="이전 이미지"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
                aria-label="다음 이미지"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 overflow-x-auto rounded-xl bg-black/40 p-2 backdrop-blur-sm">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDirection(index > currentIndex ? "right" : "left");
                    setCurrentIndex(index);
                  }}
                  className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                    index === currentIndex
                      ? "border-navy"
                      : "border-transparent opacity-50 hover:opacity-100"
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
