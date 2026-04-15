"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import Image from "next/image";

type ImageData = {
  id?: string;
  url: string;
  type: "EXTERIOR" | "INTERIOR" | "KITCHEN" | "OTHER";
  sortOrder: number;
};

export default function ListingEditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [listingId, setListingId] = useState("");
  const [images, setImages] = useState<ImageData[]>([]);
  const [formData, setFormData] = useState({
    storeName: "",
    deposit: "",
    monthlyRent: "",
    premium: "",
    premiumNone: false,
    premiumNegotiable: false,
    premiumBusiness: "",
    premiumBusinessDesc: "",
    premiumFacility: "",
    premiumFacilityDesc: "",
    premiumLocation: "",
    premiumLocationDesc: "",
    maintenanceFee: "",
    monthlyRevenue: "",
    monthlyProfit: "",
    currentFloor: "",
    totalFloor: "",
    areaPyeong: "",
    description: "",
    contactPublic: true,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/sell/edit");
      return;
    }
    if (status === "authenticated") {
      // Fetch user's listing
      fetch("/api/mypage")
        .then((r) => r.json())
        .then((data) => {
          if (!data.listing) {
            setMessage("등록된 매물이 없습니다.");
            setLoading(false);
            return;
          }
          setListingId(data.listing.id);
          // Fetch full listing details
          return fetch(`/api/listings/${data.listing.id}`);
        })
        .then((r) => r?.json())
        .then((listing) => {
          if (listing) {
            setFormData({
              storeName: listing.storeName || "",
              deposit: listing.deposit?.toString() || "",
              monthlyRent: listing.monthlyRent?.toString() || "",
              premium: listing.premium?.toString() || "",
              premiumNone: listing.premiumNone || false,
              premiumNegotiable: listing.premiumNegotiable || false,
              premiumBusiness: listing.premiumBusiness?.toString() || "",
              premiumBusinessDesc: listing.premiumBusinessDesc || "",
              premiumFacility: listing.premiumFacility?.toString() || "",
              premiumFacilityDesc: listing.premiumFacilityDesc || "",
              premiumLocation: listing.premiumLocation?.toString() || "",
              premiumLocationDesc: listing.premiumLocationDesc || "",
              maintenanceFee: listing.maintenanceFee?.toString() || "",
              monthlyRevenue: listing.monthlyRevenue?.toString() || "",
              monthlyProfit: listing.monthlyProfit?.toString() || "",
              currentFloor: listing.currentFloor?.toString() || "",
              totalFloor: listing.totalFloor?.toString() || "",
              areaPyeong: listing.areaPyeong?.toString() || "",
              description: listing.description || "",
              contactPublic: listing.contactPublic ?? true,
            });
            // Load existing images
            if (listing.images && Array.isArray(listing.images)) {
              setImages(listing.images.map((img: any) => ({
                id: img.id,
                url: img.url,
                type: img.type || "OTHER",
                sortOrder: img.sortOrder || 0,
              })));
            }
            setLoading(false);
          }
        })
        .catch(() => {
          setMessage("매물 정보를 불러올 수 없습니다.");
          setLoading(false);
        });
    }
  }, [status, router]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name}은(는) 10MB를 초과합니다.`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setImages((prev) => [
            ...prev,
            {
              url: data.url,
              type: "OTHER",
              sortOrder: prev.length,
            },
          ]);
        } else {
          toast.error(`${file.name} 업로드 실패`);
        }
      }
    } catch (err) {
      toast.error("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = "";
    }
  }

  function handleImageDelete(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleImageTypeChange(index: number, type: "EXTERIOR" | "INTERIOR" | "KITCHEN" | "OTHER") {
    setImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, type } : img))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      // Calculate areaSqm from areaPyeong
      const areaPyeong = formData.areaPyeong ? parseFloat(formData.areaPyeong) : null;
      const areaSqm = areaPyeong ? areaPyeong * 3.3058 : null;

      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          deposit: parseInt(formData.deposit) || 0,
          monthlyRent: parseInt(formData.monthlyRent) || 0,
          premium: parseInt(formData.premium) || 0,
          premiumBusiness: formData.premiumBusiness ? parseInt(formData.premiumBusiness) : null,
          premiumFacility: formData.premiumFacility ? parseInt(formData.premiumFacility) : null,
          premiumLocation: formData.premiumLocation ? parseInt(formData.premiumLocation) : null,
          maintenanceFee: formData.maintenanceFee ? parseInt(formData.maintenanceFee) : null,
          monthlyRevenue: formData.monthlyRevenue ? parseInt(formData.monthlyRevenue) : null,
          monthlyProfit: formData.monthlyProfit ? parseInt(formData.monthlyProfit) : null,
          currentFloor: formData.currentFloor ? parseInt(formData.currentFloor) : null,
          totalFloor: formData.totalFloor ? parseInt(formData.totalFloor) : null,
          areaPyeong,
          areaSqm,
          images: images.map((img, idx) => ({
            url: img.url,
            type: img.type,
            sortOrder: idx,
          })),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("매물이 수정되었습니다.");
        router.push(`/listings/${listingId}`);
      } else {
        setMessage(data.error || "저장에 실패했습니다.");
      }
    } catch (err) {
      setMessage("오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("정말로 이 매물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("매물이 삭제되었습니다.");
        router.push("/mypage");
      } else {
        const data = await res.json();
        toast.error(data.error || "삭제에 실패했습니다.");
      }
    } catch (err) {
      toast.error("오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!listingId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <p className="text-green-800">{message || "등록된 매물이 없습니다."}</p>
          <button
            onClick={() => router.push("/sell")}
            className="mt-4 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600"
          >
            매물 등록하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">매물 수정</h1>
      <p className="text-sm text-gray-500 mt-1 mb-4">
        주소, 업종, 테마는 수정이 불가합니다. 변경이 필요하면 매물을 삭제 후 재등록해주세요.
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 mb-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              매물명
            </label>
            <input
              type="text"
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                보증금 (만원)
              </label>
              <input
                type="number"
                value={formData.deposit}
                onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                월세 (만원)
              </label>
              <input
                type="number"
                value={formData.monthlyRent}
                onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              권리금 (만원)
            </label>
            <input
              type="number"
              value={formData.premium}
              onChange={(e) => setFormData({ ...formData, premium: e.target.value })}
              disabled={formData.premiumNone}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 text-base"
            />
            <div className="flex gap-4 mt-2">
              <label className="flex items-center text-sm text-gray-600 touch-manipulation">
                <input
                  type="checkbox"
                  checked={formData.premiumNone}
                  onChange={(e) => setFormData({ ...formData, premiumNone: e.target.checked })}
                  className="mr-2 w-4 h-4"
                />
                무권리
              </label>
              <label className="flex items-center text-sm text-gray-600 touch-manipulation">
                <input
                  type="checkbox"
                  checked={formData.premiumNegotiable}
                  onChange={(e) => setFormData({ ...formData, premiumNegotiable: e.target.checked })}
                  className="mr-2 w-4 h-4"
                />
                협의가능
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              관리비 (만원)
            </label>
            <input
              type="number"
              value={formData.maintenanceFee}
              onChange={(e) => setFormData({ ...formData, maintenanceFee: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
            />
          </div>

          {/* 층수 / 면적 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                현재 층수
              </label>
              <input
                type="number"
                value={formData.currentFloor}
                onChange={(e) => setFormData({ ...formData, currentFloor: e.target.value })}
                placeholder="예: 1 (지하는 음수)"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                전체 층수
              </label>
              <input
                type="number"
                value={formData.totalFloor}
                onChange={(e) => setFormData({ ...formData, totalFloor: e.target.value })}
                placeholder="예: 5"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              면적 (평)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.areaPyeong}
              onChange={(e) => setFormData({ ...formData, areaPyeong: e.target.value })}
              placeholder="예: 20"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
            />
            {formData.areaPyeong && (
              <p className="text-xs text-gray-500 mt-1">
                ≈ {(parseFloat(formData.areaPyeong) * 3.3058).toFixed(2)}m²
              </p>
            )}
          </div>

          {/* 권리금 산정 */}
          {!formData.premiumNone && formData.premium && parseInt(formData.premium) > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">권리금 산정 (선택)</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">영업권리금 (만원)</label>
                    <input
                      type="number"
                      value={formData.premiumBusiness}
                      onChange={(e) => setFormData({ ...formData, premiumBusiness: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">산정 사유</label>
                    <input
                      type="text"
                      placeholder="예: 안정적인 매출, 단골고객 확보"
                      value={formData.premiumBusinessDesc}
                      onChange={(e) => setFormData({ ...formData, premiumBusinessDesc: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">시설권리금 (만원)</label>
                    <input
                      type="number"
                      value={formData.premiumFacility}
                      onChange={(e) => setFormData({ ...formData, premiumFacility: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">산정 사유</label>
                    <input
                      type="text"
                      placeholder="예: 최신 인테리어, 고가 주방기기"
                      value={formData.premiumFacilityDesc}
                      onChange={(e) => setFormData({ ...formData, premiumFacilityDesc: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">바닥권리금 (만원)</label>
                    <input
                      type="number"
                      value={formData.premiumLocation}
                      onChange={(e) => setFormData({ ...formData, premiumLocation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">산정 사유</label>
                    <input
                      type="text"
                      placeholder="예: 역세권, 주요 상권 입지"
                      value={formData.premiumLocationDesc}
                      onChange={(e) => setFormData({ ...formData, premiumLocationDesc: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 매출/수익 정보 */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">매출/수익 정보 (선택)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">월 매출 (만원)</label>
                <input
                  type="number"
                  value={formData.monthlyRevenue}
                  onChange={(e) => setFormData({ ...formData, monthlyRevenue: e.target.value })}
                  placeholder="예: 500"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">월 순이익 (만원)</label>
                <input
                  type="number"
                  value={formData.monthlyProfit}
                  onChange={(e) => setFormData({ ...formData, monthlyProfit: e.target.value })}
                  placeholder="예: 200"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              매물 설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base resize-none"
            />
          </div>

          {/* 사진 관리 */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">사진 관리</h3>

            {/* 기존 사진 목록 */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <div className="aspect-square relative rounded-lg overflow-hidden border-2 border-gray-200">
                      <Image
                        src={img.url}
                        alt={`매물 사진 ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleImageDelete(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow-lg"
                    >
                      ×
                    </button>
                    <select
                      value={img.type}
                      onChange={(e) => handleImageTypeChange(idx, e.target.value as any)}
                      className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <option value="EXTERIOR">외부</option>
                      <option value="INTERIOR">내부</option>
                      <option value="KITCHEN">주방</option>
                      <option value="OTHER">기타</option>
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* 사진 추가 버튼 */}
            <div>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  {uploading ? "업로드 중..." : "사진 추가"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">
                JPG, PNG, GIF, WebP (각 10MB 이하)
              </p>
            </div>
          </div>

          <div>
            <label className="flex items-center text-sm text-gray-700 touch-manipulation">
              <input
                type="checkbox"
                checked={formData.contactPublic}
                onChange={(e) => setFormData({ ...formData, contactPublic: e.target.checked })}
                className="mr-2 w-4 h-4"
              />
              연락처 공개
            </label>
          </div>
        </div>

        {message && (
          <div className="mt-4 p-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700">
            {message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            type="button"
            onClick={() => router.push("/mypage")}
            className="w-full sm:flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 font-medium touch-manipulation"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:flex-1 px-4 py-3 bg-green-700 text-white rounded-lg hover:bg-green-600 active:bg-green-800 font-medium disabled:opacity-50 touch-manipulation"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>

      {/* Delete Button */}
      <div className="bg-white rounded-xl border border-red-200 p-4 md:p-5">
        <h3 className="font-bold text-gray-900 mb-2">매물 삭제</h3>
        <p className="text-sm text-gray-600 mb-4">
          매물을 삭제하면 모든 정보가 영구적으로 삭제됩니다.
        </p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 font-medium disabled:opacity-50 touch-manipulation min-w-[120px]"
        >
          {deleting ? "삭제 중..." : "매물 삭제"}
        </button>
      </div>
    </div>
  );
}
