"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EQUIPMENT_CATEGORY_LABELS, EQUIPMENT_CONDITION_LABELS } from "@/lib/constants";
import Image from "next/image";

declare global {
  interface Window {
    daum: any;
  }
}

const CATEGORY_ICONS: Record<string, string> = {
  KITCHEN: "🍳",
  REFRIGERATION: "🧊",
  TABLE_CHAIR: "🪑",
  DISPLAY: "🗄️",
  COOKING_TOOL: "🔪",
  POS_ELECTRONIC: "💻",
  SIGN: "🪧",
  INTERIOR: "🖼️",
  OTHER: "📦",
};

export default function EquipmentRegisterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [checkingVerification, setCheckingVerification] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [isFree, setIsFree] = useState(false);
  const [negotiable, setNegotiable] = useState(false);
  const [tradeMethod, setTradeMethod] = useState("");
  const [description, setDescription] = useState("");
  const [brand, setBrand] = useState("");
  const [modelName, setModelName] = useState("");
  const [purchaseYear, setPurchaseYear] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [addressRoad, setAddressRoad] = useState("");
  const [addressJibun, setAddressJibun] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [images, setImages] = useState<{ url: string; sortOrder: number }[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/equipment/register");
      return;
    }

    if (status === "authenticated") {
      const role = (session?.user as any)?.role;
      if (!["SELLER", "FRANCHISE", "PARTNER", "ADMIN"].includes(role)) {
        alert("사업자 회원만 집기를 등록할 수 있습니다.");
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
            // 등록 수 제한 확인
            fetch("/api/equipment/my-count")
              .then((r) => r.json())
              .then((countData) => {
                if (countData.count >= 10) {
                  alert("집기는 최대 10개까지 등록할 수 있습니다.");
                  router.push("/equipment");
                } else {
                  setCheckingVerification(false);
                }
              })
              .catch(() => setCheckingVerification(false));
          }
        })
        .catch(() => setCheckingVerification(false));
    }
  }, [status, session, router]);

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
      },
    }).open();
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

    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    if (!category) {
      alert("카테고리를 선택해주세요.");
      return;
    }
    if (!condition) {
      alert("상태를 선택해주세요.");
      return;
    }
    if (!tradeMethod) {
      alert("거래방식을 선택해주세요.");
      return;
    }
    if (!description || description.length < 10) {
      alert("설명을 10자 이상 입력해주세요.");
      return;
    }
    if (images.length === 0) {
      alert("사진을 최소 1장 이상 업로드해주세요.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          condition,
          price: isFree ? 0 : price,
          negotiable: isFree ? false : negotiable,
          tradeMethod,
          description,
          brand: brand || null,
          modelName: modelName || null,
          purchaseYear: purchaseYear ? parseInt(purchaseYear) : null,
          quantity,
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
        alert("집기가 등록되었습니다!");
        router.push(`/equipment/${data.id}`);
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
        <div className="animate-pulse text-gray-400 dark:text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!session) return null;

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">집기 등록</h1>
        <p className="text-gray-600 dark:text-gray-400">사업자인증을 완료한 회원만 등록할 수 있습니다</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            제목 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="예: 업소용 냉장고 1200L 판매합니다"
          />
        </div>

        {/* 카테고리 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            카테고리 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {Object.entries(EQUIPMENT_CATEGORY_LABELS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-sm font-medium transition-colors border-2 ${
                  category === key
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <span className="text-xl">{CATEGORY_ICONS[key] || "📦"}</span>
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 상태 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            상태 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            {Object.entries(EQUIPMENT_CONDITION_LABELS).map(([key, label]) => {
              const colors: Record<string, string> = {
                EXCELLENT: "border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300",
                GOOD: "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
                FAIR: "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300",
              };
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCondition(key)}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors border-2 ${
                    condition === key
                      ? colors[key]
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 가격 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            가격 <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={isFree ? 0 : price}
                onChange={(e) => setPrice(Number(e.target.value))}
                disabled={isFree}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-400"
                placeholder="가격을 입력하세요"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">원</span>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => {
                    setIsFree(e.target.checked);
                    if (e.target.checked) {
                      setPrice(0);
                      setNegotiable(false);
                    }
                  }}
                  className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">무료 나눔</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={negotiable}
                  disabled={isFree}
                  onChange={(e) => setNegotiable(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">협의가능</span>
              </label>
            </div>
          </div>
        </div>

        {/* 거래방식 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            거래방식 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            {[
              { key: "DIRECT", label: "직거래" },
              { key: "DELIVERY", label: "택배" },
              { key: "BOTH", label: "둘다" },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTradeMethod(key)}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors border-2 ${
                  tradeMethod === key
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 설명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            설명 <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            placeholder="집기의 상태, 사용기간, 특이사항 등을 상세히 작성해주세요 (최소 10자)"
          />
          <p className={`text-sm mt-1 ${description.length < 10 ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}>
            {description.length}자 / 최소 10자
          </p>
        </div>

        {/* 브랜드 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">브랜드 (선택)</label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="예: 삼성, LG, 대우 등"
          />
        </div>

        {/* 모델명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">모델명 (선택)</label>
          <input
            type="text"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="예: RF-520"
          />
        </div>

        {/* 구매연도 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">구매연도 (선택)</label>
          <select
            value={purchaseYear}
            onChange={(e) => setPurchaseYear(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">선택하세요</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
        </div>

        {/* 수량 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">수량</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* 주소 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">거래 위치 (선택)</label>
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

        {/* 사진 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            사진 <span className="text-red-500">*</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">(최소 1장)</span>
          </label>
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
                  <Image src={img.url} alt="" fill className="object-cover rounded-lg" unoptimized />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full text-xs hover:bg-red-700 z-10"
                  >
                    x
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
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {submitting ? "등록 중..." : "등록하기"}
        </button>
      </form>
    </div>
  );
}
