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
  const [showSuccess, setShowSuccess] = useState(false);
  const [registeredId, setRegisteredId] = useState("");

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

    const uploadedImageUrls: string[] = [];
    const uploadedDocUrls: string[] = [];

    try {
      const uploadedImages: { url: string; type: string; sortOrder: number }[] = [];
      for (const img of data.images) {
        if (img.file) {
          const formData = new FormData();
          formData.append("file", img.file);
          const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
          if (!uploadRes.ok) throw new Error("이미지 업로드 실패");
          const { url } = await uploadRes.json();
          uploadedImageUrls.push(url); // 추적용
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
          uploadedDocUrls.push(url); // 추적용
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
        // 등록 실패 시 업로드된 이미지 정리
        await cleanupOrphanImages([...uploadedImageUrls, ...uploadedDocUrls]);
        setError(result.error || "등록에 실패했습니다.");
        return;
      }

      reset();
      setRegisteredId(result.id);
      setShowSuccess(true);
    } catch (err) {
      // 예외 발생 시 업로드된 이미지 정리
      await cleanupOrphanImages([...uploadedImageUrls, ...uploadedDocUrls]);
      setError("등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function cleanupOrphanImages(urls: string[]) {
    if (urls.length === 0) return;

    try {
      // 업로드된 이미지 정리 API 호출 (non-blocking)
      await fetch("/api/upload/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      }).catch(() => {
        // 정리 실패는 무시 (크론잡이 나중에 처리)
        console.warn("이미지 정리 실패, 크론잡이 처리합니다.");
      });
    } catch {
      // 무시
    }
  }

  return (
    <>
      {/* 성공 모달 */}
      {showSuccess && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
          onClick={() => {
            setShowSuccess(false);
            router.push(`/listings/${registeredId}`);
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 체크 아이콘 */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* 제목 & 설명 */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-3">
              매물 등록 완료!
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              매물이 성공적으로 등록되었습니다.<br />지금 바로 노출됩니다.
            </p>

            {/* 구분선 */}
            <div className="h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent mb-6"></div>

            {/* 광고 유도 섹션 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 mb-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                더 많은 예비창업자에게 알리고 싶다면?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                광고 상품을 이용하면 조회수가 평균 5배 증가합니다
              </p>

              {/* 혜택 리스트 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span>검색 결과 상위 노출</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  <span>프리미엄 배지 표시</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>조회수 리포트 제공</span>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push("/pricing")}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                광고 상품 보기
              </button>
              <button
                onClick={() => router.push(`/listings/${registeredId}`)}
                className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                내 매물 보기
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <Image src={img.url} alt={`매물 사진 ${i + 1} - ${img.type === "EXTERIOR" ? "외부" : img.type === "INTERIOR" ? "내부" : img.type === "KITCHEN" ? "주방" : "기타"}`} fill className="object-cover" sizes="150px" />
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
    </>
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
