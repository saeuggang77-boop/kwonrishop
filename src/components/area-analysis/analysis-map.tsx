"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import type { NearbyPlace } from "@/lib/utils/area-analysis";
import { KAKAO_CATEGORY_MAP } from "@/lib/utils/area-analysis";
import { Map, MapMarker, Circle, CustomOverlayMap, useKakaoLoader, useMap } from "react-kakao-maps-sdk";

interface AnalysisMapProps {
  center: { lat: number; lng: number } | null;
  radius: number;
  places: NearbyPlace[];
  selectedCategory: string | null;
}

function MapCenterUpdater({ center, radius }: { center: { lat: number; lng: number }; radius: number }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.setCenter(new window.kakao.maps.LatLng(center.lat, center.lng));

    // Adjust zoom level based on radius
    if (radius <= 300) map.setLevel(4);
    else if (radius <= 500) map.setLevel(5);
    else map.setLevel(6);
  }, [map, center, radius]);

  return null;
}

export function AnalysisMap({ center, radius, places, selectedCategory }: AnalysisMapProps) {
  const [error, setError] = useState(false);
  const [clickedPlace, setClickedPlace] = useState<NearbyPlace | null>(null);

  const KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  const [loading, sdkError] = useKakaoLoader({
    appkey: KEY ?? "",
    libraries: ["services"],
  });

  useEffect(() => {
    if (!KEY || sdkError) setError(true);
  }, [KEY, sdkError]);

  const filtered = selectedCategory
    ? places.filter((p) => p.categoryKey === selectedCategory)
    : places;

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-400">
        <MapPin className="h-12 w-12 text-gray-300" />
        <p className="mt-2 text-sm">지도를 불러올 수 없습니다</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-xl border border-gray-200">
        <div className="flex h-full items-center justify-center" style={{ minHeight: "400px" }}>
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#1B3A5C]" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-gray-200">
      <Map
        center={center ?? { lat: 37.5665, lng: 126.978 }}
        style={{ width: "100%", height: "100%", minHeight: "400px" }}
        level={5}
        onClick={() => setClickedPlace(null)}
      >
        {center && <MapCenterUpdater center={center} radius={radius} />}

        {/* Center marker */}
        {center && (
          <MapMarker
            position={center}
            zIndex={10}
          />
        )}

        {/* Radius circle */}
        {center && (
          <Circle
            center={center}
            radius={radius}
            strokeWeight={2}
            strokeColor="#1B3A5C"
            strokeOpacity={0.8}
            fillColor="#1B3A5C"
            fillOpacity={0.08}
          />
        )}

        {/* Place markers */}
        {filtered.map((place) => {
          const catConfig = KAKAO_CATEGORY_MAP[place.categoryKey];
          const pos = { lat: Number(place.y), lng: Number(place.x) };

          return (
            <MapMarker
              key={place.id}
              position={pos}
              title={place.name}
              onClick={() => setClickedPlace(clickedPlace?.id === place.id ? null : place)}
            />
          );
        })}

        {/* Info window for clicked place */}
        {clickedPlace && (
          <CustomOverlayMap
            position={{ lat: Number(clickedPlace.y), lng: Number(clickedPlace.x) }}
            yAnchor={1.4}
            zIndex={2}
          >
            <div style={{
              padding: "8px 12px",
              fontSize: "13px",
              minWidth: "180px",
              lineHeight: "1.5",
              background: "white",
              borderRadius: "4px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            }}>
              <strong style={{ color: "#1B3A5C" }}>{clickedPlace.name}</strong><br/>
              <span style={{ color: "#888", fontSize: "11px" }}>
                {KAKAO_CATEGORY_MAP[clickedPlace.categoryKey]?.label ?? clickedPlace.category}
              </span>
              <span style={{ color: "#aaa", fontSize: "11px", marginLeft: "4px" }}>
                {clickedPlace.distance}m
              </span>
            </div>
          </CustomOverlayMap>
        )}
      </Map>
    </div>
  );
}
