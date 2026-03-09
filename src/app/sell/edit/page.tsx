"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ListingEditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [listingId, setListingId] = useState("");
  const [formData, setFormData] = useState({
    storeName: "",
    deposit: "",
    monthlyRent: "",
    premium: "",
    premiumNone: false,
    premiumNegotiable: false,
    maintenanceFee: "",
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
              maintenanceFee: listing.maintenanceFee?.toString() || "",
              description: listing.description || "",
              contactPublic: listing.contactPublic ?? true,
            });
            setLoading(false);
          }
        })
        .catch(() => {
          setMessage("매물 정보를 불러올 수 없습니다.");
          setLoading(false);
        });
    }
  }, [status, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          deposit: parseInt(formData.deposit) || 0,
          monthlyRent: parseInt(formData.monthlyRent) || 0,
          premium: parseInt(formData.premium) || 0,
          maintenanceFee: formData.maintenanceFee ? parseInt(formData.maintenanceFee) : null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("매물이 수정되었습니다.");
        setTimeout(() => {
          router.push(`/listings/${listingId}`);
        }, 1000);
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
        alert("매물이 삭제되었습니다.");
        router.push("/mypage");
      } else {
        const data = await res.json();
        alert(data.error || "삭제에 실패했습니다.");
      }
    } catch (err) {
      alert("오류가 발생했습니다.");
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
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center">
          <p className="text-yellow-800">{message || "등록된 매물이 없습니다."}</p>
          <button
            onClick={() => router.push("/sell")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            매물 등록하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">매물 수정</h1>

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
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
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
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
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
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
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
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-base"
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
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              매물 설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base resize-none"
            />
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
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.includes("성공") || message.includes("수정되었습니다")
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}>
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
            className="w-full sm:flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 font-medium disabled:opacity-50 touch-manipulation"
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
