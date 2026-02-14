"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

declare global {
  interface Window {
    kakao: any;
  }
}

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

export function KakaoMap({ listings }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(false);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Load Kakao Map SDK
  useEffect(() => {
    const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!KAKAO_KEY) {
      setError(true);
      return;
    }

    if (window.kakao?.maps) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => {
        setMapLoaded(true);
      });
    };
    script.onerror = () => setError(true);
    document.head.appendChild(script);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const options = {
      center: new window.kakao.maps.LatLng(37.5665, 126.978),
      level: 8,
    };

    mapInstanceRef.current = new window.kakao.maps.Map(mapRef.current, options);
  }, [mapLoaded]);

  // Update markers when listings change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    const map = mapInstanceRef.current;
    const geocoder = new window.kakao.maps.services.Geocoder();

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new window.kakao.maps.LatLngBounds();
    let hasValidCoords = false;

    listings.forEach((listing) => {
      if (listing.latitude && listing.longitude) {
        const position = new window.kakao.maps.LatLng(listing.latitude, listing.longitude);
        addMarker(map, position, listing);
        bounds.extend(position);
        hasValidCoords = true;
      } else if (listing.address) {
        geocoder.addressSearch(listing.address, (result: any, status: any) => {
          if (status === window.kakao.maps.services.Status.OK) {
            const position = new window.kakao.maps.LatLng(result[0].y, result[0].x);
            addMarker(map, position, listing);
            bounds.extend(position);
            if (markersRef.current.length > 1) {
              map.setBounds(bounds);
            } else {
              map.setCenter(position);
              map.setLevel(5);
            }
          }
        });
      }
    });

    if (hasValidCoords && markersRef.current.length > 1) {
      map.setBounds(bounds);
    } else if (hasValidCoords && markersRef.current.length === 1) {
      map.setCenter(bounds.getSouthWest());
      map.setLevel(5);
    }
  }, [listings, mapLoaded]);

  function addMarker(map: any, position: any, listing: Listing) {
    const isPremium = listing.premium && listing.premium > 0;

    const markerImage = new window.kakao.maps.MarkerImage(
      isPremium
        ? "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png"
        : "https://t1.daumcdn.net/localimg/localimages/07/2018/pc/img/marker_spot.png",
      new window.kakao.maps.Size(isPremium ? 24 : 29, isPremium ? 35 : 40)
    );

    const marker = new window.kakao.maps.Marker({
      map,
      position,
      image: markerImage,
      title: listing.title,
    });

    const deposit = listing.deposit ? `보증금 ${(listing.deposit / 10000).toLocaleString()}만원` : "";

    const infowindow = new window.kakao.maps.InfoWindow({
      content: `<div style="padding:8px 12px;font-size:13px;min-width:150px;line-height:1.4;">
        <strong style="color:#1B3A5C;">${listing.title}</strong>
        ${deposit ? `<br/><span style="color:#666;">${deposit}</span>` : ""}
      </div>`,
    });

    window.kakao.maps.event.addListener(marker, "mouseover", () => {
      infowindow.open(map, marker);
    });
    window.kakao.maps.event.addListener(marker, "mouseout", () => {
      infowindow.close();
    });
    window.kakao.maps.event.addListener(marker, "click", () => {
      window.location.href = `/listings/${listing.id}`;
    });

    markersRef.current.push(marker);
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-gray-400">
        <MapPin className="h-16 w-16 text-gray-300" />
        <p className="mt-3 text-sm font-medium text-gray-400">지도를 불러올 수 없습니다</p>
      </div>
    );
  }

  return (
    <div ref={mapRef} className="h-full w-full" style={{ minHeight: "500px" }}>
      {!mapLoaded && (
        <div className="flex h-full items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#1B3A5C]" />
        </div>
      )}
    </div>
  );
}
