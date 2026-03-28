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
  category: { name: string; icon: string | null } | null;
}

interface ListingMapViewProps {
  listings: Listing[];
  filterParams?: Record<string, string>;
}

export default function ListingMapView({ listings, filterParams }: ListingMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapListings, setMapListings] = useState<Listing[]>([]);
  const [fetching, setFetching] = useState(false);
  const router = useRouter();

  // Filter listings with valid coordinates
  const validListings = (mapListings.length > 0 ? mapListings : listings).filter(
    (l) => l.latitude !== null && l.longitude !== null
  );

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
  }, []);

  const renderMarkers = useCallback(
    (map: any, items: Listing[]) => {
      const kakaoMaps = window.kakao?.maps;
      if (!kakaoMaps) return;

      clearMarkers();

      items
        .filter((l) => l.latitude !== null && l.longitude !== null)
        .forEach((listing) => {
          const position = new kakaoMaps.LatLng(listing.latitude!, listing.longitude!);
          const marker = new kakaoMaps.Marker({ position });
          marker.setMap(map);

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

          const infoWindow = new kakaoMaps.InfoWindow({ content });

          kakaoMaps.event.addListener(marker, "click", () => {
            infoWindow.open(map, marker);
            setTimeout(() => {
              const el = document.querySelector(`[data-listing-id="${listing.id}"]`);
              if (el) {
                el.addEventListener("click", () => {
                  router.push(`/listings/${listing.id}`);
                });
              }
            }, 100);
          });

          markersRef.current.push(marker);
        });
    },
    [clearMarkers, router]
  );

  const fetchByBounds = useCallback(
    async (map: any) => {
      const kakaoMaps = window.kakao?.maps;
      if (!kakaoMaps || !map) return;

      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      const params = new URLSearchParams({
        swLat: sw.getLat().toString(),
        swLng: sw.getLng().toString(),
        neLat: ne.getLat().toString(),
        neLng: ne.getLng().toString(),
        limit: "100",
      });

      // 기존 필터 유지
      if (filterParams) {
        Object.entries(filterParams).forEach(([k, v]) => {
          if (v && !["page", "limit", "swLat", "swLng", "neLat", "neLng"].includes(k)) {
            params.set(k, v);
          }
        });
      }

      setFetching(true);
      try {
        const res = await fetch(`/api/listings?${params}`);
        const data = await res.json();
        const items = data.listings || [];
        setMapListings(items);
        renderMarkers(map, items);
      } catch {
        // 실패 시 기존 마커 유지
      } finally {
        setFetching(false);
      }
    },
    [filterParams, renderMarkers]
  );

  const initializeMap = useCallback(() => {
    const kakaoMaps = window.kakao?.maps;
    if (!mapRef.current || !kakaoMaps) return;

    try {
      const defaultCenter = new kakaoMaps.LatLng(37.5665, 126.978);
      const container = mapRef.current;
      const options = { center: defaultCenter, level: 5 };
      const map = new kakaoMaps.Map(container, options);
      mapInstanceRef.current = map;

      // 초기 매물로 마커 렌더링 + bounds 조정
      const initialValid = listings.filter((l) => l.latitude !== null && l.longitude !== null);
      if (initialValid.length > 0) {
        const bounds = new kakaoMaps.LatLngBounds();
        initialValid.forEach((l) => {
          bounds.extend(new kakaoMaps.LatLng(l.latitude!, l.longitude!));
        });
        renderMarkers(map, initialValid);
        map.setBounds(bounds);
      }

      // idle 이벤트: 드래그/줌 완료 후 bounds 기반 매물 로딩
      kakaoMaps.event.addListener(map, "idle", () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          fetchByBounds(map);
        }, 500);
      });

      setLoading(false);
    } catch (err) {
      console.error("Map initialization error:", err);
      setError("지도를 초기화하는데 실패했습니다.");
      setLoading(false);
    }
  }, [listings, renderMarkers, fetchByBounds]);

  useEffect(() => {
    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

    if (!kakaoKey) {
      setError("Kakao Map API 키가 설정되지 않았습니다.");
      setLoading(false);
      return;
    }

    if (window.kakao?.maps) {
      initializeMap();
      return;
    }

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

  // filterParams 변경 시 현재 bounds로 재검색
  useEffect(() => {
    if (mapInstanceRef.current && !loading) {
      fetchByBounds(mapInstanceRef.current);
    }
  }, [filterParams]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-gray-100 rounded-xl">
        <p className="text-sm text-gray-500">{error}</p>
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
      {fetching && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-white/90 backdrop-blur px-4 py-1.5 rounded-full shadow text-sm text-gray-600">
          매물 검색 중...
        </div>
      )}
      <div
        ref={mapRef}
        className="w-full h-[500px] rounded-xl"
      />
      <div className="mt-2 text-xs text-gray-500 text-center">
        {validListings.length}개 매물 표시 중 · 지도를 움직이면 해당 영역의 매물을 자동으로 검색합니다
      </div>
    </div>
  );
}
