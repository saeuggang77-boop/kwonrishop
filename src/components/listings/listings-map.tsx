"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Map, MapMarker, CustomOverlayMap, useKakaoLoader } from "react-kakao-maps-sdk";
import { useDebounce } from "@/hooks/use-debounce";
import { ListingMarkerPopup } from "./listing-marker-popup";
import { MapPin } from "lucide-react";

/* ================================================================
   Types
   ================================================================ */

interface ClusterItem {
  name: string;
  count: number;
  lat: number;
  lng: number;
}

interface MarkerItem {
  id: string;
  title: string;
  businessCategory: string;
  price: string;
  monthlyRent: string | null;
  premiumFee: string | null;
  city: string;
  district: string;
  neighborhood: string | null;
  latitude: number;
  longitude: number;
  isPremium: boolean;
  premiumRank: number;
  safetyGrade: string | null;
  images: { url: string; thumbnailUrl: string | null }[];
}

export interface MapBounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

interface MapFilters {
  businessCategory?: string;
  businessSubtype?: string;
  storeType?: string;
  city?: string;
  district?: string;
  trustedOnly?: boolean;
  diagnosisOnly?: boolean;
  urgentOnly?: boolean;
  premiumFeeMax?: string;
  monthlyProfitMin?: string;
  monthlyProfitMax?: string;
  totalCostMin?: string;
  totalCostMax?: string;
}

interface ListingsMapProps {
  filters: MapFilters;
  onBoundsChange?: (bounds: MapBounds, level: number) => void;
}

/* ================================================================
   Helpers
   ================================================================ */

/** Returns circle diameter based on digit count */
function getCircleSize(count: number): number {
  if (count >= 1000) return 42;
  if (count >= 100) return 38;
  if (count >= 10) return 32;
  return 28;
}

/* ================================================================
   Component
   ================================================================ */

export function ListingsMap({ filters, onBoundsChange }: ListingsMapProps) {
  const [error, setError] = useState(false);
  const [level, setLevel] = useState(8);
  const [clusters, setClusters] = useState<ClusterItem[]>([]);
  const [markers, setMarkers] = useState<MarkerItem[]>([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const initializedRef = useRef(false);

  const mapCenter = useMemo(() => ({ lat: 37.5665, lng: 126.978 }), []);
  const mapStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);

  const KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  const [loading, sdkError] = useKakaoLoader({
    appkey: KEY ?? "",
    libraries: ["services"],
  });

  useEffect(() => {
    if (!KEY || sdkError) setError(true);
  }, [KEY, sdkError]);

  const debouncedLevel = useDebounce(level, 300);
  const debouncedBounds = useDebounce(bounds, 300);

  /* ---- Build API filter params ---- */
  const buildFilterParams = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.businessCategory) params.set("businessCategory", filters.businessCategory);
    if (filters.businessSubtype) params.set("businessSubtype", filters.businessSubtype);
    if (filters.storeType) params.set("storeType", filters.storeType);
    if (filters.city) params.set("city", filters.city);
    if (filters.district) params.set("district", filters.district);
    if (filters.trustedOnly) params.set("trustedOnly", "true");
    if (filters.diagnosisOnly) params.set("diagnosisOnly", "true");
    if (filters.premiumFeeMax) params.set("premiumFeeMax", filters.premiumFeeMax);
    if (filters.monthlyProfitMin) params.set("monthlyProfitMin", filters.monthlyProfitMin);
    if (filters.monthlyProfitMax) params.set("monthlyProfitMax", filters.monthlyProfitMax);
    if (filters.totalCostMin) params.set("totalCostMin", filters.totalCostMin);
    if (filters.totalCostMax) params.set("totalCostMax", filters.totalCostMax);
    return params;
  }, [filters]);

  /* ---- Fetch map data ---- */
  useEffect(() => {
    if (!debouncedBounds || loading || error) return;

    const controller = new AbortController();
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const params = buildFilterParams();

        if (debouncedLevel <= 5) {
          // Individual markers
          params.set("mode", "markers");
          params.set("swLat", String(debouncedBounds.swLat));
          params.set("swLng", String(debouncedBounds.swLng));
          params.set("neLat", String(debouncedBounds.neLat));
          params.set("neLng", String(debouncedBounds.neLng));
        } else {
          // Clusters
          params.set("mode", "clusters");
          params.set("zoom", String(debouncedLevel));
        }

        const res = await fetch(`/api/listings/map?${params}`, {
          signal: controller.signal,
        });
        const json = await res.json();

        if (debouncedLevel <= 5) {
          setMarkers(json.data ?? []);
          setClusters([]);
        } else {
          setClusters(json.data ?? []);
          setMarkers([]);
        }
        setSelectedMarkerId(null);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          /* ignore */
        }
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [debouncedLevel, debouncedBounds, buildFilterParams, loading, error]);

  /* ---- Map event handler (zoom / drag) ---- */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMapEvent = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (map: any) => {
      const newLevel = map.getLevel();
      setLevel(newLevel);

      const b = map.getBounds();
      const sw = b.getSouthWest();
      const ne = b.getNorthEast();
      const newBounds: MapBounds = {
        swLat: sw.getLat(),
        swLng: sw.getLng(),
        neLat: ne.getLat(),
        neLng: ne.getLng(),
      };
      setBounds(newBounds);
      onBoundsChange?.(newBounds, newLevel);
    },
    [onBoundsChange],
  );

  /* ---- Stable onCreate handler (avoids infinite loop) ---- */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCreate = useCallback((map: any) => {
    mapRef.current = map;
    if (!initializedRef.current) {
      initializedRef.current = true;
      // Defer to avoid setState during layout effect
      setTimeout(() => {
        if (mapRef.current) handleMapEvent(mapRef.current);
      }, 0);
    }
  }, [handleMapEvent]);

  /* ---- Cluster click → zoom in ---- */
  const handleClusterClick = useCallback(
    (cluster: ClusterItem) => {
      if (!mapRef.current) return;
      // District click → zoom to neighborhood level; Neighborhood click → zoom to marker level
      const targetLevel = level >= 9 ? 7 : 4;
      mapRef.current.setLevel(targetLevel);
      mapRef.current.setCenter(
        new (window as any).kakao.maps.LatLng(cluster.lat, cluster.lng),
      );
      // Manually trigger update after programmatic change
      setTimeout(() => {
        if (mapRef.current) handleMapEvent(mapRef.current);
      }, 100);
    },
    [level, handleMapEvent],
  );

  /* ---- Render states ---- */
  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-gray-400">
        <MapPin className="h-16 w-16 text-gray-300" />
        <p className="mt-3 text-sm font-medium">지도를 불러올 수 없습니다</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#1B3A5C]" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <Map
        center={mapCenter}
        style={mapStyle}
        level={8}
        onCreate={handleCreate}
        onZoomChanged={handleMapEvent}
        onDragEnd={handleMapEvent}
      >
        {/* ── Cluster overlays (circle + label) ── */}
        {clusters.map((cluster, idx) => {
          const circleSize = getCircleSize(cluster.count);
          const numFontSize = circleSize >= 38 ? 14 : 13;
          return (
            <CustomOverlayMap
              key={`cluster-${cluster.name}-${idx}`}
              position={{ lat: cluster.lat, lng: cluster.lng }}
              zIndex={1}
            >
              <div
                onClick={() => handleClusterClick(cluster)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "transform 0.15s",
                  fontFamily: "'Noto Sans KR', sans-serif",
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))",
                }}
              >
                {/* Purple circle with number */}
                <div
                  style={{
                    width: `${circleSize}px`,
                    height: `${circleSize}px`,
                    borderRadius: "50%",
                    background: "#6366F1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: `${numFontSize}px`,
                    fontWeight: 800,
                    lineHeight: 1,
                    border: "2px solid white",
                    zIndex: 2,
                    flexShrink: 0,
                  }}
                >
                  {cluster.count}
                </div>
                {/* White label with region name */}
                <div
                  style={{
                    marginLeft: "-6px",
                    padding: "4px 10px 4px 12px",
                    borderRadius: "0 12px 12px 0",
                    background: "white",
                    border: "1.5px solid #d1d5db",
                    borderLeft: "none",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#374151",
                    whiteSpace: "nowrap",
                    lineHeight: 1.2,
                    zIndex: 1,
                  }}
                >
                  {cluster.name}
                </div>
              </div>
            </CustomOverlayMap>
          );
        })}

        {/* ── Individual markers ── */}
        {markers.map((marker) => (
          <MapMarker
            key={marker.id}
            position={{ lat: marker.latitude, lng: marker.longitude }}
            image={{
              src: marker.isPremium
                ? "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png"
                : "https://t1.daumcdn.net/localimg/localimages/07/2018/pc/img/marker_spot.png",
              size: marker.isPremium ? { width: 24, height: 35 } : { width: 29, height: 40 },
            }}
            title={marker.title}
            onClick={() =>
              setSelectedMarkerId(marker.id === selectedMarkerId ? null : marker.id)
            }
          />
        ))}

        {/* ── Selected marker popup ── */}
        {selectedMarkerId &&
          (() => {
            const marker = markers.find((m) => m.id === selectedMarkerId);
            if (!marker) return null;
            return (
              <CustomOverlayMap
                position={{ lat: marker.latitude, lng: marker.longitude }}
                yAnchor={1.35}
                zIndex={10}
              >
                <ListingMarkerPopup
                  marker={marker}
                  onClose={() => setSelectedMarkerId(null)}
                />
              </CustomOverlayMap>
            );
          })()}
      </Map>

      {/* Loading indicator */}
      {isLoadingData && (
        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 shadow-sm">
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-[#6366F1]" />
          <span className="text-xs text-gray-500">로딩중...</span>
        </div>
      )}
    </div>
  );
}
