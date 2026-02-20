"use client";

import { useEffect, useRef, useState } from "react";
import { MapPinned, Store, Footprints, Loader2 } from "lucide-react";
import type { NearbyResult, SeoulData } from "@/lib/utils/area-analysis";
import { isSeoulAddress } from "@/lib/utils/area-analysis";

declare global {
  interface Window {
    kakao: any;
  }
}

interface LocationSectionProps {
  lat: number | null;
  lng: number | null;
  address: string;
  addressDetail: string | null;
  city: string;
  district: string;
  neighborhood: string | null;
  postalCode: string | null;
}

// ── Kakao category code → facility mapping ──
const FACILITY_MAP: Record<string, { emoji: string; name: string }> = {
  SW8: { emoji: "🚇", name: "지하철역" },
  // BK9 not in our area-analysis API, use nearby search
};

// Categories we want for facilities
const FACILITY_CATEGORIES = [
  { code: "SW8", emoji: "🚇", name: "지하철역" },
  { code: "BT1", emoji: "🚌", name: "버스정류장" },
  { code: "BK9", emoji: "🏦", name: "은행/ATM" },
  { code: "PK6", emoji: "🅿️", name: "주차장" },
  { code: "HP8", emoji: "🏥", name: "병원/약국" },
];

interface FacilityData {
  emoji: string;
  name: string;
  detail: string;
  distance: string;
}

function distanceToWalk(meters: number): string {
  const minutes = Math.round(meters / 67); // ~67m/min walking speed
  if (minutes < 1) return "도보 1분 이내";
  return `도보 ${minutes}분 (${meters}m)`;
}

export function ListingLocationSection({
  lat,
  lng,
  address,
  addressDetail,
  city,
  district,
  neighborhood,
  postalCode,
}: LocationSectionProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const mapInstanceRef = useRef<any>(null);

  const [facilities, setFacilities] = useState<FacilityData[]>([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);

  const [trafficData, setTrafficData] = useState<{ time: string; level: number; label: string }[]>([]);
  const [trafficLoading, setTrafficLoading] = useState(true);
  const [trafficSource, setTrafficSource] = useState<"seoul" | "estimated" | null>(null);

  const [nearestSubway, setNearestSubway] = useState<string | null>(null);
  const [busStopCount, setBusStopCount] = useState<number | null>(null);
  const [dailyFootTraffic, setDailyFootTraffic] = useState<string | null>(null);

  const isSeoul = isSeoulAddress(`${city} ${district}`);

  // ── Load Kakao SDK ──
  useEffect(() => {
    const KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!KEY) { setMapError(true); return; }
    if (window.kakao?.maps) { setMapLoaded(true); return; }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => window.kakao.maps.load(() => setMapLoaded(true));
    script.onerror = () => setMapError(true);
    document.head.appendChild(script);
  }, []);

  // ── Render map ──
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !lat || !lng) return;
    if (mapInstanceRef.current) return;

    const pos = new window.kakao.maps.LatLng(lat, lng);
    const map = new window.kakao.maps.Map(mapRef.current, {
      center: pos,
      level: 4,
    });
    mapInstanceRef.current = map;

    // Marker
    new window.kakao.maps.Marker({ map, position: pos });

    // InfoWindow
    const iw = new window.kakao.maps.InfoWindow({
      content: `<div style="padding:6px 10px;font-size:13px;font-weight:600;color:#1B3A5C;white-space:nowrap;">${address}</div>`,
    });
    iw.open(map, new window.kakao.maps.Marker({ map, position: pos }));
  }, [mapLoaded, lat, lng, address]);

  // ── Fetch facilities via Kakao REST (through our proxy) ──
  useEffect(() => {
    if (!lat || !lng) { setFacilitiesLoading(false); return; }

    const fetchFacilities = async () => {
      try {
        const KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
        if (!KEY || !window.kakao?.maps?.services) {
          // Fallback: wait for SDK
          await new Promise<void>((resolve) => {
            const check = setInterval(() => {
              if (window.kakao?.maps?.services) { clearInterval(check); resolve(); }
            }, 200);
            setTimeout(() => { clearInterval(check); resolve(); }, 5000);
          });
        }

        if (!window.kakao?.maps?.services) { setFacilitiesLoading(false); return; }

        const places = new window.kakao.maps.services.Places();
        const results: FacilityData[] = [];

        // Search each facility category
        for (const cat of FACILITY_CATEGORIES) {
          const found = await new Promise<FacilityData | null>((resolve) => {
            places.categorySearch(cat.code, (data: any, status: any) => {
              if (status === window.kakao.maps.services.Status.OK && data.length > 0) {
                const nearest = data[0];
                const dist = Number(nearest.distance);
                resolve({
                  emoji: cat.emoji,
                  name: cat.name,
                  detail: nearest.place_name,
                  distance: distanceToWalk(dist),
                });

                // Track subway/bus for address section
                if (cat.code === "SW8") {
                  setNearestSubway(`${nearest.place_name} ${distanceToWalk(dist)}`);
                }
                if (cat.code === "BT1") {
                  // Count bus stops within 500m
                  const nearby = data.filter((d: any) => Number(d.distance) <= 500);
                  setBusStopCount(nearby.length);
                }
              } else {
                resolve({
                  emoji: cat.emoji,
                  name: cat.name,
                  detail: "",
                  distance: "정보 없음",
                });
                if (cat.code === "SW8") setNearestSubway(null);
                if (cat.code === "BT1") setBusStopCount(0);
              }
            }, {
              location: new window.kakao.maps.LatLng(lat, lng),
              radius: 2000,
              sort: window.kakao.maps.services.SortBy.DISTANCE,
              size: 5,
            });
          });

          if (found) results.push(found);
        }

        setFacilities(results);
      } catch (err) {
        console.error("Facilities fetch error:", err);
      } finally {
        setFacilitiesLoading(false);
      }
    };

    fetchFacilities();
  }, [lat, lng]);

  // ── Fetch foot traffic ──
  useEffect(() => {
    if (!lat || !lng) { setTrafficLoading(false); return; }

    const fetchTraffic = async () => {
      try {
        if (isSeoul) {
          // Pass neighborhood (dong) parameter for location filtering
          const dongParam = neighborhood ? `&dong=${encodeURIComponent(neighborhood)}` : "";
          const res = await fetch(`/api/area-analysis/seoul?lat=${lat}&lng=${lng}${dongParam}`);
          if (res.ok) {
            const data: SeoulData = await res.json();
            if (data.footTraffic.length > 0) {
              const total = data.footTraffic.reduce((s, d) => s + d.count, 0);
              const daily = Math.round(total / 7);
              setDailyFootTraffic(`약 ${daily.toLocaleString("ko-KR")}명`);

              // Convert day-of-week data to time-of-day estimation
              // Seoul API gives daily totals; approximate time distribution
              const avgDaily = daily;
              setTrafficData([
                { time: "오전 (6-12시)", level: Math.min(Math.round((avgDaily * 0.2) / (avgDaily * 0.003)), 100), label: getTrafficLabel(avgDaily * 0.2) },
                { time: "점심 (12-14시)", level: Math.min(Math.round((avgDaily * 0.25) / (avgDaily * 0.003)), 100), label: getTrafficLabel(avgDaily * 0.25) },
                { time: "오후 (14-18시)", level: Math.min(Math.round((avgDaily * 0.25) / (avgDaily * 0.003)), 100), label: getTrafficLabel(avgDaily * 0.25) },
                { time: "저녁 (18-22시)", level: Math.min(Math.round((avgDaily * 0.2) / (avgDaily * 0.003)), 100), label: getTrafficLabel(avgDaily * 0.2) },
                { time: "야간 (22-6시)", level: Math.min(Math.round((avgDaily * 0.1) / (avgDaily * 0.003)), 100), label: getTrafficLabel(avgDaily * 0.1) },
              ]);
              setTrafficSource("seoul");
              setTrafficLoading(false);
              return;
            }
          }
        }

        // Non-Seoul or Seoul API failed: estimate from nearby facility density
        const nearbyRes = await fetch(`/api/area-analysis/nearby?x=${lng}&y=${lat}&radius=500`);
        if (nearbyRes.ok) {
          const nearbyData: NearbyResult[] = await nearbyRes.json();
          const totalPlaces = nearbyData.reduce((s, r) => s + r.count, 0);

          // Heuristic: more nearby places = more foot traffic
          const densityFactor = Math.min(totalPlaces / 100, 1); // normalize to 0-1
          const base = Math.round(densityFactor * 100);

          setTrafficData([
            { time: "오전 (6-12시)", level: Math.round(base * 0.6), label: getTrafficLabel(base * 0.6 * 300) },
            { time: "점심 (12-14시)", level: Math.round(base * 0.95), label: getTrafficLabel(base * 0.95 * 300) },
            { time: "오후 (14-18시)", level: Math.round(base * 0.75), label: getTrafficLabel(base * 0.75 * 300) },
            { time: "저녁 (18-22시)", level: Math.round(base * 0.85), label: getTrafficLabel(base * 0.85 * 300) },
            { time: "야간 (22-6시)", level: Math.round(base * 0.3), label: getTrafficLabel(base * 0.3 * 300) },
          ]);
          setDailyFootTraffic(`약 ${Math.round(totalPlaces * 200).toLocaleString("ko-KR")}명 (추정)`);
          setTrafficSource("estimated");
        }
      } catch (err) {
        console.error("Traffic fetch error:", err);
      } finally {
        setTrafficLoading(false);
      }
    };

    fetchTraffic();
  }, [lat, lng, isSeoul, neighborhood]);

  return (
    <section id="location-info" className="mt-12">
      <h2 className="text-xl font-bold text-navy">위치 정보</h2>

      {/* ── Map ── */}
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
        {lat && lng ? (
          <div ref={mapRef} className="aspect-[16/9] w-full">
            {!mapLoaded && !mapError && (
              <div className="flex h-full items-center justify-center bg-gray-100">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex aspect-[16/9] items-center justify-center bg-gray-200">
            <div className="text-center text-gray-500">
              <MapPinned className="mx-auto h-16 w-16 text-gray-400" />
              <p className="mt-3 text-lg font-semibold text-gray-600">위치 정보 없음</p>
              <p className="mt-1 text-sm text-gray-400">좌표가 등록되지 않은 매물입니다</p>
            </div>
          </div>
        )}
        {mapError && (
          <div className="flex aspect-[16/9] items-center justify-center bg-gray-100">
            <div className="text-center text-gray-500">
              <MapPinned className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-sm">지도를 불러올 수 없습니다</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Facilities + Foot Traffic Grid ── */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Nearby Facilities */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
            <Store className="h-4 w-4 text-navy" />
            <h3 className="text-sm font-semibold text-navy">주변 시설</h3>
          </div>
          <div className="divide-y divide-gray-50 px-5 py-2">
            {facilitiesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : facilities.length > 0 ? (
              facilities.map((f, i) => (
                <div key={i} className="flex items-center justify-between py-2.5">
                  <span className="flex items-center gap-2 text-sm text-gray-700">
                    <span>{f.emoji}</span>
                    {f.name}
                    {f.detail && (
                      <span className="text-xs text-gray-400">({f.detail})</span>
                    )}
                  </span>
                  <span className="text-xs font-medium text-gray-500">{f.distance}</span>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-gray-400">주변 시설 정보를 찾을 수 없습니다</p>
            )}
          </div>
          <div className="border-t border-gray-100 px-5 py-3">
            <p className="text-[11px] text-gray-400">
              * 카카오맵 기준 직선거리이며 실제 도보시간과 다를 수 있습니다
            </p>
          </div>
        </div>

        {/* Foot Traffic */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
            <Footprints className="h-4 w-4 text-navy" />
            <h3 className="text-sm font-semibold text-navy">유동인구 (추정)</h3>
            {trafficSource && (
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                trafficSource === "seoul" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
              }`}>
                {trafficSource === "seoul" ? "서울 공공데이터" : "주변시설 기반 추정"}
              </span>
            )}
          </div>
          <div className="px-5 py-4">
            {trafficLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : trafficData.length > 0 ? (
              <div className="space-y-3">
                {trafficData.map((t, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">{t.time}</span>
                      <span className="font-medium text-gray-700">{t.label}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-navy transition-all"
                        style={{ width: `${Math.max(t.level, 5)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-gray-400">유동인구 데이터를 불러올 수 없습니다</p>
            )}
          </div>
          <div className="border-t border-gray-100 px-5 py-3">
            <p className="text-[11px] text-gray-400">
              * 유동인구는 추정치이며 실제와 다를 수 있습니다
            </p>
          </div>
        </div>
      </div>

      {/* ── Address & Summary ── */}
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-5">
          <p className="text-xs font-medium text-gray-500">주소</p>
          <p className="mt-1 text-xl font-bold text-navy">
            {address}
            {addressDetail ? ` ${addressDetail}` : ""}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {city} {district}
            {neighborhood ? ` ${neighborhood}` : ""}
            {postalCode ? ` (${postalCode})` : ""}
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          <div className="flex items-center justify-between px-6 py-4">
            <span className="flex items-center gap-2 text-sm text-gray-600">
              🚇 가장 가까운 지하철역
            </span>
            <span className="text-sm font-semibold text-navy">
              {facilitiesLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
              ) : nearestSubway ?? "정보 없음"}
            </span>
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <span className="flex items-center gap-2 text-sm text-gray-600">
              🚌 주변 버스정류장
            </span>
            <span className="text-sm font-semibold text-navy">
              {facilitiesLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
              ) : busStopCount !== null ? `${busStopCount}개` : "정보 없음"}
            </span>
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <span className="flex items-center gap-2 text-sm text-gray-600">
              👥 일평균 유동인구
            </span>
            <span className="text-sm font-semibold text-navy">
              {trafficLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
              ) : dailyFootTraffic ?? "정보 없음"}
            </span>
          </div>
        </div>
        <div className="border-t border-gray-100 px-6 py-2">
          <p className="text-[11px] text-gray-400">
            * 유동인구는 {trafficSource === "seoul" ? "서울 공공데이터 기반" : "주변 시설 밀집도 기반 추정치"}이며 실제와 다를 수 있습니다
          </p>
        </div>
      </div>
    </section>
  );
}

function getTrafficLabel(count: number): string {
  if (count >= 25000) return "매우 많음";
  if (count >= 15000) return "많음";
  if (count >= 8000) return "보통";
  if (count >= 3000) return "적음";
  return "매우 적음";
}
