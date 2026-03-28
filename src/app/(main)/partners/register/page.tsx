"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SERVICE_TYPE_LABELS, REGION_OPTIONS } from "@/lib/constants";
import Image from "next/image";

declare global {
  interface Window {
    daum: any;
  }
}

export default function PartnerRegisterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [checkingVerification, setCheckingVerification] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [description, setDescription] = useState("");
  const [serviceArea, setServiceArea] = useState<string[]>([]);
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [addressRoad, setAddressRoad] = useState("");
  const [addressJibun, setAddressJibun] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [images, setImages] = useState<{ url: string; sortOrder: number }[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/partners/register");
      return;
    }

    if (status === "authenticated") {
      // 역할 확인 (session에서 직접 가져옴)
      if (session?.user?.role !== "PARTNER" && session?.user?.role !== "ADMIN") {
        alert("협력업체 회원만 등록할 수 있습니다.");
        router.push("/");
        return;
      }

      // 사업자인증 확인
      fetch("/api/auth/check-verification")
        .then((res) => res.json())
        .then((data) => {
          if (!data.verified) {
            alert("사업자인증이 필요합니다.");
            router.push("/verify-business");
          } else {
            setCheckingVerification(false);
          }
        })
        .catch(() => setCheckingVerification(false));
    }
  }, [status, router]);

  // Load Daum Postcode script
  useEffect(() => {
    if (typeof window !== "undefined" && !window.daum) {
      const script = document.createElement("script");
      script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  function handleAddressSearch() {
    if (!window.daum) {
      alert("주소 검색 라이브러리 로딩 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    new window.daum.Postcode({
      oncomplete: function (data: any) {
        setAddressRoad(data.roadAddress || data.jibunAddress);
        setAddressJibun(data.jibunAddress);
        // Geocoding would be needed for latitude/longitude
        // For now, leave them null
      },
    }).open();
  }

  function handleServiceAreaToggle(region: string) {
    setServiceArea((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");

        const data = await res.json();
        return data.url;
      });

      const urls = await Promise.all(uploadPromises);
      setImages((prev) => [
        ...prev,
        ...urls.map((url, idx) => ({ url, sortOrder: prev.length + idx })),
      ]);
    } catch (error) {
      console.error("Image upload error:", error);
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  function handleRemoveImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!companyName.trim()) {
      alert("업체명을 입력해주세요.");
      return;
    }

    if (!serviceType) {
      alert("서비스 유형을 선택해주세요.");
      return;
    }

    if (!description || description.length < 10) {
      alert("서비스 소개를 10자 이상 입력해주세요.");
      return;
    }

    if (serviceArea.length === 0) {
      alert("서비스 가능 지역을 최소 1개 이상 선택해주세요.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          serviceType,
          description,
          serviceArea,
          contactPhone: contactPhone || null,
          contactEmail: contactEmail || null,
          website: website || null,
          addressRoad: addressRoad || null,
          addressJibun: addressJibun || null,
          addressDetail: addressDetail || null,
          latitude,
          longitude,
          images,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("협력업체가 등록되었습니다!");
        router.push(`/partners/${data.id}`);
      } else {
        alert(data.error || "등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("등록 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading" || checkingVerification) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-gray-400">로딩 중...</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">협력업체 등록</h1>
        <p className="text-gray-600 dark:text-gray-400">사업자인증을 완료한 협력업체만 등록할 수 있습니다</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 업체명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            업체명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="예: 홍길동 인테리어"
          />
        </div>

        {/* 서비스 유형 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            서비스 유형 <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">선택하세요</option>
            {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* 서비스 소개 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            서비스 소개 <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            placeholder="서비스 내용, 경력, 강점 등을 상세히 작성해주세요 (최소 10자)"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description.length}자</p>
        </div>

        {/* 서비스 가능 지역 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            서비스 가능 지역 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {REGION_OPTIONS.map((region) => (
              <button
                key={region}
                type="button"
                onClick={() => handleServiceAreaToggle(region)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  serviceArea.includes(region)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        {/* 위치 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">위치 (선택)</label>
          <button
            type="button"
            onClick={handleAddressSearch}
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors mb-2"
          >
            주소 검색
          </button>
          {addressRoad && (
            <div className="space-y-2">
              <input
                type="text"
                value={addressRoad}
                readOnly
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl"
              />
              <input
                type="text"
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                placeholder="상세 주소 (예: 3층)"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          )}
        </div>

        {/* 연락처 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">연락처 (선택)</label>
          <input
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="010-0000-0000"
          />
        </div>

        {/* 이메일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">이메일 (선택)</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="example@email.com"
          />
        </div>

        {/* 웹사이트 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">웹사이트 (선택)</label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="https://example.com"
          />
        </div>

        {/* 사진 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">사진 (선택)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            disabled={uploading}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          {uploading && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">업로드 중...</p>}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative h-24">
                  <Image src={img.url} alt="" fill className="object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full text-xs hover:bg-red-700 z-10"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {submitting ? "등록 중..." : "등록하기"}
        </button>
      </form>
    </div>
  );
}
