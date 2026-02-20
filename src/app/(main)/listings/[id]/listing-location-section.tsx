"use client";

import { Component, useEffect, useState } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { MapPinned, Store, Footprints, Loader2 } from "lucide-react";
import type { NearbyResult, SeoulData } from "@/lib/utils/area-analysis";
import { isSeoulAddress } from "@/lib/utils/area-analysis";
import { Map, MapMarker, CustomOverlayMap, useKakaoLoader } from "react-kakao-maps-sdk";

// ── Error Boundary: isolate map/location errors from the rest of the page ──
interface MapErrorBoundaryProps { children: ReactNode; address: string; }
interface MapErrorBoundaryState { hasError: boolean; }

class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  constructor(props: MapErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): MapErrorBoundaryState {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("MapErrorBoundary caught:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <section id="location-info" className="mt-12">
          <h2 className="text-xl font-bold text-navy">위치 정보</h2>
          <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 py-12">
            <MapPinned className="h-12 w-12 text-navy/40" />
            <p className="mt-3 text-sm font-semibold text-gray-600">{this.props.address}</p>
            <p className="mt-2 text-xs text-gray-400">지도를 불러오는 중 오류가 발생했습니다</p>
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}

export function ListingLocationSectionSafe(props: LocationSectionProps) {
  return (
    <MapErrorBoundary address={props.address}>
      <ListingLocationSection {...props} />
    </MapErrorBoundary>
  );
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

// Facility type returned from /api/area-analysis/facilities
interface FacilityAPIResult {
  code: string;
  emoji: string;
  name: string;
  places: { name: string; distance: number }[];
  count: number;
}

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
  const [mapError, setMapError] = useState(false);

  const [resolvedLat, setResolvedLat] = useState<number | null>(lat);
  const [resolvedLng, setResolvedLng] = useState<number | null>(lng);
  const [geocoding, setGeocoding] = useState(false);

  const [facilities, setFacilities] = useState<FacilityData[]>([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);

  const [trafficData, setTrafficData] = useState<{ time: string; level: number; label: string }[]>([]);
  const [trafficLoading, setTrafficLoading] = useState(true);
  const [trafficSource, setTrafficSource] = useState<"seoul" | "estimated" | null>(null);

  const [nearestSubway, setNearestSubway] = useState<string | null>(null);
  const [busStopCount, setBusStopCount] = useState<number | null>(null);
  const [dailyFootTraffic, setDailyFootTraffic] = useState<string | null>(null);

  const isSeoul = isSeoulAddress(`${city} ${district}`);

  // ── Kakao SDK via react-kakao-maps-sdk ──
  const KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  const [loading, sdkError] = useKakaoLoader({
    appkey: KEY ?? "",
    libraries: ["services"],
  });

  useEffect(() => {
    if (!KEY) setMapError(true);
  }, [KEY]);

  useEffect(() => {
    if (sdkError) setMapError(true);
  }, [sdkError]);

  // ── Geocode fallback when lat/lng missing ──
  useEffect(() => {
    if (lat && lng) {
      setResolvedLat(lat);
      setResolvedLng(lng);
      return;
    }
    if (!address) return;

    setGeocoding(true);
    fetch(`/api/geocode?address=${encodeURIComponent(address)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.lat && data?.lng) {
          setResolvedLat(data.lat);
          setResolvedLng(data.lng);
        }
      })
      .catch(err => console.error("Geocode error:", err))
      .finally(() => setGeocoding(false));
  }, [lat, lng, address]);

  // ── Fetch facilities via REST API fallback ──
  useEffect(() => {
    if (!resolvedLat || !resolvedLng) { setFacilitiesLoading(false); return; }

    const fetchFacilities = async () => {
      try {
        // Use REST API for facilities (more reliable than SDK)
        const res = await fetch(`/api/area-analysis/facilities?lat=${resolvedLat}&lng=${resolvedLng}`);
        if (!res.ok) throw new Error('API failed');

        const data: { code: string; emoji: string; name: string; places: { name: string; distance: number }[]; count: number }[] = await res.json();

        const results: FacilityData[] = data.map(cat => {
          if (cat.places.length > 0) {
            const nearest = cat.places[0];
            const detail = nearest.name;
            const distance = distanceToWalk(nearest.distance);

            // Track subway/bus for address section
            if (cat.code === "SW8") {
              setNearestSubway(`${nearest.name} ${distance}`);
            }
            if (cat.code === "BT1") {
              const nearby500 = cat.places.filter(p => p.distance <= 500);
              setBusStopCount(nearby500.length);
            }

            return { emoji: cat.emoji, name: cat.name, detail, distance };
          }

          // No places found
          if (cat.code === "SW8") setNearestSubway(null);
          if (cat.code === "BT1") setBusStopCount(0);

          return { emoji: cat.emoji, name: cat.name, detail: "", distance: "정보 없음" };
        });

        setFacilities(results);
      } catch (err) {
        console.error("Facilities fetch error:", err);
      } finally {
        setFacilitiesLoading(false);
      }
    };

    fetchFacilities();
  }, [resolvedLat, resolvedLng]);

  // ── Fetch foot traffic ──
  useEffect(() => {
    if (!resolvedLat || !resolvedLng) { setTrafficLoading(false); return; }

    const fetchTraffic = async () => {
      try {
        if (isSeoul) {
          // Pass neighborhood (dong) parameter for location filtering
          const dongParam = neighborhood ? `&dong=${encodeURIComponent(neighborhood)}` : "";
          const res = await fetch(`/api/area-analysis/seoul?lat=${resolvedLat}&lng=${resolvedLng}${dongParam}`);
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
        const nearbyRes = await fetch(`/api/area-analysis/nearby?x=${resolvedLng}&y=${resolvedLat}&radius=500`);
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
  }, [resolvedLat, resolvedLng, isSeoul, neighborhood]);

  return (
    <section id="location-info" className="mt-12">
      <h2 className="text-xl font-bold text-navy">위치 정보</h2>

      {/* ── Map ── */}
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
        {resolvedLat && resolvedLng ? (
          mapError ? (
            <div className="flex aspect-[16/9] flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <MapPinned className="h-12 w-12 text-navy/40" />
              <p className="mt-3 text-sm font-semibold text-gray-600">{address}</p>
              <a
                href={`https://map.kakao.com/link/map/${encodeURIComponent(address)},${resolvedLat},${resolvedLng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy/90"
              >
                카카오맵에서 보기
              </a>
            </div>
          ) : loading ? (
            <div className="flex aspect-[16/9] items-center justify-center bg-gray-100">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div style={{ width: "100%", aspectRatio: "16/9", minHeight: "300px" }}>
              <Map
                center={{ lat: resolvedLat, lng: resolvedLng }}
                style={{ width: "100%", height: "100%" }}
                level={4}
              >
                <MapMarker position={{ lat: resolvedLat, lng: resolvedLng }} />
                <CustomOverlayMap position={{ lat: resolvedLat, lng: resolvedLng }} yAnchor={2.2}>
                  <div style={{ padding: "6px 10px", fontSize: "13px", fontWeight: 600, color: "#1B3A5C", whiteSpace: "nowrap", background: "white", borderRadius: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
                    {address}
                  </div>
                </CustomOverlayMap>
              </Map>
            </div>
          )
        ) : geocoding ? (
          <div className="flex aspect-[16/9] items-center justify-center bg-gray-100">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">주소로 위치를 찾는 중...</span>
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
