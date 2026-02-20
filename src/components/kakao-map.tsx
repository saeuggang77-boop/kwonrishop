"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { Map, MapMarker, CustomOverlayMap, useKakaoLoader, useMap } from "react-kakao-maps-sdk";

interface Listing {
  id: string;
  title: string;
  address?: string | null;
  addressDetail?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  premium?: number;
  deposit?: number | null;
  categoryId?: string | null;
}

interface KakaoMapProps {
  listings: Listing[];
}

interface ResolvedListing extends Listing {
  lat: number;
  lng: number;
}

function BoundsFitter({ listings }: { listings: ResolvedListing[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || listings.length === 0) return;

    if (listings.length === 1) {
      map.setCenter(new window.kakao.maps.LatLng(listings[0].lat, listings[0].lng));
      map.setLevel(5);
    } else {
      const bounds = new window.kakao.maps.LatLngBounds();
      listings.forEach((l) => {
        bounds.extend(new window.kakao.maps.LatLng(l.lat, l.lng));
      });
      map.setBounds(bounds);
    }
  }, [map, listings]);

  return null;
}

export function KakaoMap({ listings }: KakaoMapProps) {
  const [error, setError] = useState(false);
  const [resolved, setResolved] = useState<ResolvedListing[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  const [loading, sdkError] = useKakaoLoader({
    appkey: KEY ?? "",
    libraries: ["services"],
  });

  useEffect(() => {
    if (!KEY || sdkError) setError(true);
  }, [KEY, sdkError]);

  // Resolve listings: use lat/lng directly or geocode addresses
  useEffect(() => {
    if (loading || error) return;

    const directResolved: ResolvedListing[] = [];
    const needsGeocode: Listing[] = [];

    listings.forEach((listing) => {
      if (listing.latitude && listing.longitude) {
        directResolved.push({ ...listing, lat: listing.latitude, lng: listing.longitude });
      } else if (listing.address) {
        needsGeocode.push(listing);
      }
    });

    if (needsGeocode.length === 0) {
      setResolved(directResolved);
      return;
    }

    // Geocode listings without coordinates
    const geocoder = new window.kakao.maps.services.Geocoder();
    let pending = needsGeocode.length;
    const geocoded: ResolvedListing[] = [];

    needsGeocode.forEach((listing) => {
      geocoder.addressSearch(listing.address!, (result: any, status: any) => {
        if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
          geocoded.push({ ...listing, lat: Number(result[0].y), lng: Number(result[0].x) });
        }
        pending--;
        if (pending === 0) {
          setResolved([...directResolved, ...geocoded]);
        }
      });
    });
  }, [listings, loading, error]);

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-gray-400">
        <MapPin className="h-16 w-16 text-gray-300" />
        <p className="mt-3 text-sm font-medium text-gray-400">지도를 불러올 수 없습니다</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center" style={{ minHeight: "500px" }}>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#1B3A5C]" />
      </div>
    );
  }

  return (
    <Map
      center={{ lat: 37.5665, lng: 126.978 }}
      style={{ width: "100%", height: "100%", minHeight: "500px" }}
      level={8}
    >
      <BoundsFitter listings={resolved} />
      {resolved.map((listing) => {
        const isPremium = listing.premium != null && listing.premium > 0;
        const deposit = listing.deposit ? `보증금 ${(listing.deposit / 10000).toLocaleString()}만원` : "";

        return (
          <MapMarker
            key={listing.id}
            position={{ lat: listing.lat, lng: listing.lng }}
            image={{
              src: isPremium
                ? "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png"
                : "https://t1.daumcdn.net/localimg/localimages/07/2018/pc/img/marker_spot.png",
              size: isPremium ? { width: 24, height: 35 } : { width: 29, height: 40 },
            }}
            title={listing.title}
            onClick={() => {
              window.location.href = `/listings/${listing.id}`;
            }}
            onMouseOver={() => setHoveredId(listing.id)}
            onMouseOut={() => setHoveredId(null)}
          />
        );
      })}
      {/* Hover info overlay */}
      {hoveredId && (() => {
        const listing = resolved.find((l) => l.id === hoveredId);
        if (!listing) return null;
        const deposit = listing.deposit ? `보증금 ${(listing.deposit / 10000).toLocaleString()}만원` : "";
        return (
          <CustomOverlayMap
            position={{ lat: listing.lat, lng: listing.lng }}
            yAnchor={1.4}
            zIndex={1}
          >
            <div style={{
              padding: "8px 12px",
              fontSize: "13px",
              minWidth: "150px",
              lineHeight: "1.4",
              background: "white",
              borderRadius: "4px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            }}>
              <strong style={{ color: "#1B3A5C" }}>{listing.title}</strong>
              {deposit && <><br/><span style={{ color: "#666" }}>{deposit}</span></>}
            </div>
          </CustomOverlayMap>
        );
      })()}
    </Map>
  );
}
