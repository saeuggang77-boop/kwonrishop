"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

/// <reference path="../../types/kakao.d.ts" />

interface Listing {
  id: string;
  latitude: number | null;
  longitude: number | null;
  storeName: string | null;
  addressRoad: string | null;
  premium: number;
  deposit: number;
  monthlyRent: number;
  category: { name: string; icon: string } | null;
}

interface ListingMapViewProps {
  listings: Listing[];
}

export default function ListingMapView({ listings }: ListingMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Filter listings with valid coordinates
  const validListings = listings.filter(
    (l) => l.latitude !== null && l.longitude !== null
  );

  const initializeMap = useCallback(() => {
    const kakaoMaps = window.kakao?.maps;
    if (!mapRef.current || !kakaoMaps) return;

    try {
      // Default center: Seoul City Hall
      const defaultCenter = new kakaoMaps.LatLng(37.5665, 126.978);

      const container = mapRef.current;
      const options = {
        center: defaultCenter,
        level: 5,
      };

      const map = new kakaoMaps.Map(container, options);

      if (validListings.length === 0) {
        setLoading(false);
        return;
      }

      const bounds = new kakaoMaps.LatLngBounds();

      validListings.forEach((listing) => {
        const position = new kakaoMaps.LatLng(
          listing.latitude!,
          listing.longitude!
        );

        const marker = new kakaoMaps.Marker({
          position: position,
        });
        marker.setMap(map);

        // Custom info window content
        const content = `
          <div style="padding:12px;min-width:200px;cursor:pointer;" data-listing-id="${listing.id}">
            <div style="font-weight:600;font-size:14px;margin-bottom:4px;">
              ${listing.category?.icon || ""} ${listing.storeName || listing.addressRoad || "매물"}
            </div>
            <div style="font-size:12px;color:#666;margin-bottom:6px;">
              ${listing.addressRoad || ""}
            </div>
            <div style="display:flex;gap:8px;font-size:12px;">
              <span>보증 <b>${listing.deposit.toLocaleString()}만</b></span>
              <span>월세 <b>${listing.monthlyRent.toLocaleString()}만</b></span>
            </div>
            <div style="font-size:12px;color:#2563eb;margin-top:4px;">
              권리금 <b>${listing.premium.toLocaleString()}만</b>
            </div>
            <div style="margin-top:8px;font-size:11px;color:#2563eb;">
              클릭하여 상세보기 →
            </div>
          </div>
        `;

        const infoWindow = new kakaoMaps.InfoWindow({
          content: content,
        });

        // Show info window on marker click
        kakaoMaps.event.addListener(marker, "click", () => {
          infoWindow.open(map, marker);

          // Add click event to the info window content
          setTimeout(() => {
            const infoElement = document.querySelector(`[data-listing-id="${listing.id}"]`);
            if (infoElement) {
              infoElement.addEventListener("click", () => {
                router.push(`/listings/${listing.id}`);
              });
            }
          }, 100);
        });

        bounds.extend(position);
      });

      // Fit bounds to show all markers
      map.setBounds(bounds);

      setLoading(false);
    } catch (err) {
      console.error("Map initialization error:", err);
      setError("지도를 초기화하는데 실패했습니다.");
      setLoading(false);
    }
  }, [validListings, router]);

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
  }, [initializeMap]);

  if (error) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-gray-100 rounded-xl">
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (validListings.length === 0) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-gray-100 rounded-xl">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">지도에 표시할 매물이 없습니다</p>
          <p className="text-xs text-gray-400">위치 정보가 등록된 매물만 표시됩니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl z-10">
          <p className="text-sm text-gray-500">지도 로딩 중...</p>
        </div>
      )}
      <div
        ref={mapRef}
        className="w-full h-[500px] rounded-xl"
      />
      <div className="mt-2 text-xs text-gray-500 text-center">
        {validListings.length}개 매물 표시 중 (전체 {listings.length}개)
      </div>
    </div>
  );
}
