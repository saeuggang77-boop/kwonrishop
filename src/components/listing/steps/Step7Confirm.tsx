"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useListingFormStore } from "@/store/listingForm";

interface Props {
  onPrev: () => void;
}

type ServiceKey = "hometax" | "creditfinance" | "baemin" | "yogiyo" | "coupangeats";

const SERVICES: { key: ServiceKey; icon: string; title: string; description: string }[] = [
  { key: "hometax", icon: "🏛️", title: "홈택스", description: "간편인증으로 매출 데이터 연동" },
  { key: "creditfinance", icon: "💳", title: "여신금융협회", description: "카드매출 데이터 연동" },
  { key: "baemin", icon: "🛵", title: "배달의민족", description: "배달 매출 데이터 연동" },
  { key: "yogiyo", icon: "🍔", title: "요기요", description: "배달 매출 데이터 연동" },
  { key: "coupangeats", icon: "📦", title: "쿠팡이츠", description: "배달 매출 데이터 연동" },
];

export default function Step7Confirm({ onPrev }: Props) {
  const { data, reset } = useListingFormStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  function formatPrice(value: number) {
    return value === 0 ? "0" : value.toLocaleString();
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");

    try {
      const uploadedImages: { url: string; type: string; sortOrder: number }[] = [];
      for (const img of data.images) {
        if (img.file) {
          const formData = new FormData();
          formData.append("file", img.file);
          const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
          if (!uploadRes.ok) throw new Error("이미지 업로드 실패");
          const { url } = await uploadRes.json();
          uploadedImages.push({ url, type: img.type, sortOrder: img.sortOrder });
        } else if (img.url) {
          uploadedImages.push({ url: img.url, type: img.type, sortOrder: img.sortOrder });
        }
      }

      // 매출증빙자료 업로드
      const uploadedDocs: { url: string; sortOrder: number }[] = [];
      for (const doc of data.documents) {
        if (doc.file) {
          const formData = new FormData();
          formData.append("file", doc.file);
          const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
          if (!uploadRes.ok) throw new Error("증빙자료 업로드 실패");
          const { url } = await uploadRes.json();
          uploadedDocs.push({ url, sortOrder: doc.sortOrder });
        } else if (doc.url) {
          uploadedDocs.push({ url: doc.url, sortOrder: doc.sortOrder });
        }
      }

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          images: uploadedImages,
          documents: uploadedDocs,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "등록에 실패했습니다.");
        return;
      }

      reset();
      router.push(`/listings/${result.id}?registered=true`);
    } catch {
      setError("등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">등록 확인</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">입력한 내용을 확인하고 등록해주세요</p>

      <div className="space-y-4">
        <Section title="위치정보">
          <Info label="주소" value={data.addressRoad || data.addressJibun} />
          {data.addressDetail && <Info label="상세주소" value={data.addressDetail} />}
        </Section>

        <Section title="업종 / 금액">
          <Info label="업종" value={`${data.categoryName} > ${data.subCategoryName}`} />
          <Info label="보증금" value={`${formatPrice(data.deposit)}만원`} />
          <Info label="월세" value={`${formatPrice(data.monthlyRent)}만원`} />
          <Info
            label="권리금"
            value={
              data.premiumNone
                ? "무권리"
                : `${formatPrice(data.premium)}만원${data.premiumNegotiable ? " (협의가능)" : ""}`
            }
          />
        </Section>

        <Section title="기본정보">
          <Info label="운영형태" value={data.brandType === "FRANCHISE" ? "프랜차이즈" : "개인매장"} />
          {data.storeName && <Info label="상호명" value={data.storeName} />}
          {data.areaPyeong && <Info label="면적" value={`${data.areaPyeong}평 (${data.areaSqm}m²)`} />}
          {data.currentFloor && (
            <Info label="층수" value={`${data.isBasement ? "지하 " : ""}${data.currentFloor}층 / ${data.totalFloor}층`} />
          )}
          {data.themes.length > 0 && <Info label="테마" value={data.themes.join(", ")} />}
        </Section>

        {data.monthlyRevenue !== null && (
          <Section title="수익정보">
            <Info label="월매출" value={`${formatPrice(data.monthlyRevenue)}만원`} />
            {data.monthlyProfit !== null && (
              <Info label="월순이익" value={`${formatPrice(data.monthlyProfit)}만원`} />
            )}
          </Section>
        )}

        {data.description && (
          <Section title="매물설명">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{data.description}</p>
          </Section>
        )}

        <Section title="사진">
          {data.images.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {data.images.map((img, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 relative">
                  <Image src={img.url} alt="" fill className="object-cover" sizes="150px" />
                  <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5">
                    {img.type === "EXTERIOR" ? "외부" : img.type === "INTERIOR" ? "내부" : img.type === "KITCHEN" ? "주방" : "기타"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">등록된 사진 없음</p>
          )}
        </Section>

        <Section title="연락처">
          <Info label="연락처 공개" value={data.contactPublic ? "공개" : "채팅만"} />
        </Section>
      </div>

      {/* 매출 매입자료 연동 */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">매출 매입자료 연동 (선택)</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">매출 데이터를 연동하면 매물 신뢰도가 높아집니다</p>

        <div className="space-y-3">
          {SERVICES.map((svc) => (
            <div
              key={svc.key}
              className="flex items-center gap-4 p-4 border rounded-lg border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 opacity-60"
            >
              <div className="text-3xl shrink-0">{svc.icon}</div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">{svc.title} (준비 중)</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{svc.description}</p>
              </div>
              <button
                onClick={() => showToast("해당 서비스는 준비 중입니다. 곧 오픈됩니다.")}
                disabled
                className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              >
                준비 중
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              외부 매출 자료 연동 기능은 현재 개발 중입니다. 빠른 시일 내에 오픈 예정입니다.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl shadow-lg text-sm font-medium z-50">
          {toast}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button
          onClick={onPrev}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          이전
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "등록 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex text-sm">
      <span className="w-20 text-gray-400 dark:text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-700 dark:text-gray-300">{value || "-"}</span>
    </div>
  );
}
