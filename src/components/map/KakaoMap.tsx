"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/// <reference path="../../types/kakao.d.ts" />

interface KakaoMapProps {
  latitude: number;
  longitude: number;
  level?: number;
  className?: string;
  showInfoWindow?: boolean;
  address?: string;
}

export default function KakaoMap({
  latitude,
  longitude,
  level = 3,
  className = "",
  showInfoWindow = false,
  address = "",
}: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.kakao?.maps) return;

    try {
      const container = mapRef.current;
      const options = {
        center: new window.kakao.maps.LatLng(latitude, longitude),
        level: level,
      };

      const map = new window.kakao.maps.Map(container, options);

      // Add marker
      const markerPosition = new window.kakao.maps.LatLng(latitude, longitude);
      const marker = new window.kakao.maps.Marker({
        position: markerPosition,
      });
      marker.setMap(map);

      // Add info window if enabled
      if (showInfoWindow && address) {
        const infoWindow = new window.kakao.maps.InfoWindow({
          content: `<div style="padding:8px 12px;font-size:12px;white-space:nowrap;">${address}</div>`,
        });

        window.kakao.maps.event.addListener(marker, "click", () => {
          infoWindow.open(map, marker);
        });
      }

      setLoading(false);
    } catch (err) {
      console.error("Map initialization error:", err);
      setError("지도를 초기화하는데 실패했습니다.");
      setLoading(false);
    }
  }, [latitude, longitude, level, showInfoWindow, address]);

  useEffect(() => {
    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

    if (!kakaoKey) {
      setError("Kakao Map API 키가 설정되지 않았습니다.");
      setLoading(false);
      return;
    }

    // Check if script is already loaded
    if (window.kakao?.maps) {
      initializeMap();
      return;
    }

    // Load Kakao Maps SDK
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false`;
    script.async = true;

    script.onload = () => {
      window.kakao?.maps?.load(() => {
        initializeMap();
      });
    };

    script.onerror = () => {
      setError("Kakao Map을 불러오는데 실패했습니다.");
      setLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script on unmount (optional, as it's shared)
      // script.remove();
    };
  }, [initializeMap]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-xl ${className}`}>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className={`absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl ${className}`}>
          <p className="text-sm text-gray-500">지도 로딩 중...</p>
        </div>
      )}
      <div
        ref={mapRef}
        className={`rounded-xl ${className}`}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
