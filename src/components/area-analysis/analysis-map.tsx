"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import type { NearbyPlace } from "@/lib/utils/area-analysis";
import { KAKAO_CATEGORY_MAP } from "@/lib/utils/area-analysis";

declare global {
  interface Window {
    kakao: any;
  }
}

interface AnalysisMapProps {
  center: { lat: number; lng: number } | null;
  radius: number;
  places: NearbyPlace[];
  selectedCategory: string | null;
}

export function AnalysisMap({ center, radius, places, selectedCategory }: AnalysisMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(false);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circleRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);

  // Load SDK (same pattern as kakao-map.tsx)
  useEffect(() => {
    const KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!KEY) {
      setError(true);
      return;
    }
    if (window.kakao?.maps) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => setMapLoaded(true));
    };
    script.onerror = () => setError(true);
    document.head.appendChild(script);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    if (mapInstanceRef.current) return; // already init

    mapInstanceRef.current = new window.kakao.maps.Map(mapRef.current, {
      center: new window.kakao.maps.LatLng(37.5665, 126.978),
      level: 5,
    });
  }, [mapLoaded]);

  // Update center, circle, and markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !center) return;

    const pos = new window.kakao.maps.LatLng(center.lat, center.lng);
    map.setCenter(pos);

    // Adjust zoom level based on radius
    if (radius <= 300) map.setLevel(4);
    else if (radius <= 500) map.setLevel(5);
    else map.setLevel(6);

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (circleRef.current) circleRef.current.setMap(null);
    if (infoWindowRef.current) infoWindowRef.current.close();

    // Center marker
    const centerMarker = new window.kakao.maps.Marker({
      map,
      position: pos,
      zIndex: 10,
    });
    markersRef.current.push(centerMarker);

    // Radius circle
    circleRef.current = new window.kakao.maps.Circle({
      map,
      center: pos,
      radius,
      strokeWeight: 2,
      strokeColor: "#1B3A5C",
      strokeOpacity: 0.8,
      fillColor: "#1B3A5C",
      fillOpacity: 0.08,
    });

    // Place markers
    const filtered = selectedCategory
      ? places.filter((p) => p.categoryKey === selectedCategory)
      : places;

    const iw = new window.kakao.maps.InfoWindow({ zIndex: 1 });
    infoWindowRef.current = iw;

    filtered.forEach((place) => {
      const catConfig = KAKAO_CATEGORY_MAP[place.categoryKey];
      const markerPos = new window.kakao.maps.LatLng(Number(place.y), Number(place.x));

      const marker = new window.kakao.maps.Marker({
        map,
        position: markerPos,
        title: place.name,
      });

      window.kakao.maps.event.addListener(marker, "click", () => {
        iw.setContent(
          `<div style="padding:8px 12px;font-size:13px;min-width:180px;line-height:1.5;">
            <strong style="color:#1B3A5C;">${place.name}</strong><br/>
            <span style="color:#888;font-size:11px;">${catConfig?.label ?? place.category}</span>
            <span style="color:#aaa;font-size:11px;margin-left:4px;">${place.distance}m</span>
          </div>`,
        );
        iw.open(map, marker);
      });

      markersRef.current.push(marker);
    });
  }, [center, radius, places, selectedCategory, mapLoaded]);

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-400">
        <MapPin className="h-12 w-12 text-gray-300" />
        <p className="mt-2 text-sm">지도를 불러올 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-gray-200">
      <div ref={mapRef} className="h-full w-full" style={{ minHeight: "400px" }}>
        {!mapLoaded && (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#1B3A5C]" />
          </div>
        )}
      </div>
    </div>
  );
}
