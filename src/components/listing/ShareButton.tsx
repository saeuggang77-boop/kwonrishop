"use client";

import { useState, useEffect, useRef } from "react";

interface ShareButtonProps {
  listingId: string;
  title: string;
}

declare global {
  interface Window {
    Kakao: any;
  }
}

export default function ShareButton({ listingId, title }: ShareButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  async function handleKakaoShare() {
    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

    if (!kakaoKey) {
      alert("카카오톡 공유 기능이 설정되지 않았습니다.");
      return;
    }

    try {
      // Load Kakao SDK if not loaded
      if (!window.Kakao) {
        const script = document.createElement("script");
        script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js";
        script.integrity = "sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4";
        script.crossOrigin = "anonymous";

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      // Initialize Kakao if not initialized
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(kakaoKey);
      }

      const url = `${window.location.origin}/listings/${listingId}`;

      window.Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: title,
          description: "권리샵에서 확인하세요",
          imageUrl: `${window.location.origin}/og-image.png`,
          link: {
            mobileWebUrl: url,
            webUrl: url,
          },
        },
        buttons: [
          {
            title: "자세히 보기",
            link: {
              mobileWebUrl: url,
              webUrl: url,
            },
          },
        ],
      });

      setShowDropdown(false);
    } catch (error) {
      console.error("Kakao share error:", error);
      alert("카카오톡 공유에 실패했습니다.");
    }
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/listings/${listingId}`;

    try {
      await navigator.clipboard.writeText(url);
      setShowToast(true);
      setShowDropdown(false);

      setTimeout(() => {
        setShowToast(false);
      }, 2000);
    } catch (error) {
      console.error("Copy link error:", error);
      alert("링크 복사에 실패했습니다.");
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="min-w-[60px] px-3 md:px-4 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm md:text-base font-medium"
        aria-label="공유하기"
      >
        <svg
          className="w-5 h-5 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
          <button
            onClick={handleKakaoShare}
            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
          >
            <span className="text-lg">💬</span>
            <span>카카오톡 공유</span>
          </button>
          <button
            onClick={handleCopyLink}
            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
          >
            <span className="text-lg">🔗</span>
            <span>링크 복사</span>
          </button>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
          복사되었습니다
        </div>
      )}
    </div>
  );
}
