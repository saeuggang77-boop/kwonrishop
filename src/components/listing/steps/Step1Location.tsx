"use client";

import { useState, useEffect, useRef } from "react";
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
  const [showPostcode, setShowPostcode] = useState(false);
  const postcodeRef = useRef<HTMLDivElement>(null);

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
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&libraries=services&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao?.maps?.load(() => {
        console.log("Kakao Maps SDK with services loaded");
      });
    };
    document.head.appendChild(script);
  }, []);

  // 다음 우편번호 SDK 사전 로딩
  useEffect(() => {
    if (typeof window === "undefined") return;
    const existingScript = document.querySelector('script[src*="postcode.v2.js"]');
    if (existingScript) return;

    const script = document.createElement("script");
    script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    document.head.appendChild(script);
  }, []);

  function handleAddressSearch() {
    if (typeof window === "undefined") return;

    const daum = (window as unknown as { daum?: { Postcode: new (opts: Record<string, unknown>) => { embed: (el: HTMLElement) => void } } }).daum;

    if (!daum?.Postcode) {
      setError("주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setError("");
    setShowPostcode(true);

    // embed는 다음 렌더 사이클에서 ref가 준비된 후 실행
    setTimeout(() => {
      if (!postcodeRef.current) return;

      new daum.Postcode({
        oncomplete: (result: Record<string, string>) => {
          const roadAddress = result.roadAddress;
          updateData({
            zipCode: result.zonecode,
            addressJibun: result.jibunAddress || result.autoJibunAddress,
            addressRoad: roadAddress,
          });
          setError("");
          setShowPostcode(false);

          // Geocode the address to get coordinates
          if (roadAddress) {
            geocodeAddress(roadAddress);
          }
        },
        onclose: (state: string) => {
          // FORCE_CLOSE: 사용자가 X버튼으로 닫음, COMPLETE_CLOSE: 주소 선택 완료
          if (state === "FORCE_CLOSE") {
            setShowPostcode(false);
          }
        },
        width: "100%",
        height: "100%",
      }).embed(postcodeRef.current);
    }, 100);
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
        setError("지도 좌표 변환에 실패했습니다. 주소는 저장되었으나 지도가 표시되지 않을 수 있습니다.");
      }
    });
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left text-gray-500 hover:border-navy-400 transition-colors"
          >
            {data.addressRoad || "클릭하여 주소 검색"}
          </button>

          {/* 주소 검색 임베드 영역 */}
          {showPostcode && (
            <div className="mt-2 border border-navy-300 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-navy-50 border-b border-navy-200">
                <span className="text-sm font-medium text-navy-700">주소 검색</span>
                <button
                  type="button"
                  onClick={() => setShowPostcode(false)}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                >
                  &times;
                </button>
              </div>
              <div ref={postcodeRef} className="w-full h-[400px]" />
            </div>
          )}

          {data.addressRoad && !showPostcode && (
            <div className="mt-2 text-sm text-gray-600 space-y-1">
              <p>도로명: {data.addressRoad}</p>
              {data.addressJibun && <p>지번: {data.addressJibun}</p>}
              {data.zipCode && <p>우편번호: {data.zipCode}</p>}
            </div>
          )}
          {isGeocodingLoading && (
            <p className="mt-2 text-sm text-navy-700">좌표 변환 중...</p>
          )}
        </div>

        {/* Kakao Map Display */}
        {data.latitude !== null && data.longitude !== null && !showPostcode && (
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSubmit}
          className="px-8 py-3 bg-navy-700 text-white rounded-lg font-medium hover:bg-navy-600 transition-colors"
        >
          다음
        </button>
      </div>
    </div>
  );
}
