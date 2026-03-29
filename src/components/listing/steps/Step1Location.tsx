"use client";

import { useState, useEffect } from "react";
import { useListingFormStore } from "@/store/listingForm";
import dynamic from "next/dynamic";

// Dynamically import KakaoMap to avoid SSR issues
const KakaoMap = dynamic(() => import("@/components/map/KakaoMap"), {
  ssr: false,
  loading: () => <div className="w-full h-[200px] bg-gray-100 rounded-xl flex items-center justify-center">
    <p className="text-sm text-gray-500">지도 로딩 중...</p>
  </div>
});

interface Props {
  onNext: () => void;
}

export default function Step1Location({ onNext }: Props) {
  const { data, updateData } = useListingFormStore();
  const [error, setError] = useState("");
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

  // Load Kakao Maps SDK with services library
  useEffect(() => {
    if (typeof window === "undefined") return;

    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!kakaoKey) return;

    // Check if script is already loaded
    if (window.kakao?.maps?.services) return;

    // Check if script tag already exists
    const existingScript = document.querySelector('script[src*="dapi.kakao.com/v2/maps/sdk.js"]');
    if (existingScript) return;

    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&libraries=services&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao?.maps?.load(() => {
        console.log("Kakao Maps SDK with services loaded");
      });
    };
    document.head.appendChild(script);
  }, []);

  function handleAddressSearch() {
    if (typeof window === "undefined") return;

    const daum = (window as unknown as { daum?: { Postcode: new (opts: { oncomplete: (data: Record<string, string>) => void }) => { open: () => void } } }).daum;

    if (daum?.Postcode) {
      openPostcode(daum);
      return;
    }

    // 다음 우편번호 SDK 동적 로딩
    setError("");
    const script = document.createElement("script");
    script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.onload = () => {
      const d = (window as unknown as { daum?: { Postcode: new (opts: { oncomplete: (data: Record<string, string>) => void }) => { open: () => void } } }).daum;
      if (d?.Postcode) {
        openPostcode(d);
      } else {
        setError("주소 검색 서비스를 불러올 수 없습니다.");
      }
    };
    script.onerror = () => {
      setError("주소 검색 서비스를 불러올 수 없습니다.");
    };
    document.head.appendChild(script);
  }

  function geocodeAddress(address: string) {
    if (!window.kakao?.maps?.services) {
      console.error("Kakao Maps services not loaded");
      setError("지도 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setIsGeocodingLoading(true);
    const geocoder = new window.kakao.maps.services.Geocoder();

    geocoder.addressSearch(address, (result, status) => {
      setIsGeocodingLoading(false);

      if (status === window.kakao!.maps!.services.Status.OK && result.length > 0) {
        const coords = result[0];
        const lat = parseFloat(coords.y);
        const lng = parseFloat(coords.x);

        updateData({
          latitude: lat,
          longitude: lng,
        });
        setError("");
      } else {
        // 좌표 변환 실패 시에도 주소는 저장되도록 함 (지도만 표시 안 함)
        console.warn("Geocoding failed:", status);
        updateData({
          latitude: null,
          longitude: null,
        });
      }
    });
  }

  function openPostcode(daum: { Postcode: new (opts: { oncomplete: (data: Record<string, string>) => void }) => { open: () => void } }) {
    new daum.Postcode({
      oncomplete: (result: Record<string, string>) => {
        const roadAddress = result.roadAddress;
        updateData({
          zipCode: result.zonecode,
          addressJibun: result.jibunAddress || result.autoJibunAddress,
          addressRoad: roadAddress,
        });
        setError("");

        // Geocode the address to get coordinates
        if (roadAddress) {
          geocodeAddress(roadAddress);
        }
      },
    }).open();
  }

  function handleSubmit() {
    if (!data.addressRoad && !data.addressJibun) {
      setError("주소를 검색해주세요.");
      return;
    }
    onNext();
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-1">위치정보</h2>
      <p className="text-sm text-gray-500 mb-6">매물의 위치를 입력해주세요</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            주소 <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={handleAddressSearch}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left text-gray-500 hover:border-blue-400 transition-colors"
          >
            {data.addressRoad || "클릭하여 주소 검색"}
          </button>
          {data.addressRoad && (
            <div className="mt-2 text-sm text-gray-600 space-y-1">
              <p>도로명: {data.addressRoad}</p>
              {data.addressJibun && <p>지번: {data.addressJibun}</p>}
              {data.zipCode && <p>우편번호: {data.zipCode}</p>}
            </div>
          )}
          {isGeocodingLoading && (
            <p className="mt-2 text-sm text-blue-600">좌표 변환 중...</p>
          )}
        </div>

        {/* Kakao Map Display */}
        {data.latitude !== null && data.longitude !== null && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              지도
            </label>
            <div className="w-full h-[200px] border border-gray-300 rounded-lg overflow-hidden">
              <KakaoMap
                latitude={data.latitude}
                longitude={data.longitude}
                level={3}
                showInfoWindow={true}
                address={data.addressRoad}
                className="h-full"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            상세주소 <span className="text-gray-400">(선택)</span>
          </label>
          <input
            type="text"
            placeholder="건물명, 층수 등"
            value={data.addressDetail}
            onChange={(e) => updateData({ addressDetail: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSubmit}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          다음
        </button>
      </div>
    </div>
  );
}
