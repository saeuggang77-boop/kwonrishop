"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useListingFormStore } from "@/store/listingForm";
import { formatPhone } from "@/lib/utils";
import PushPromptCard from "@/components/PushPromptCard";
import { SHOW_REVENUE_SYNC } from "@/lib/flags";
import AdProductInlineSelect from "@/components/promotion/AdProductInlineSelect";

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
  const { data, reset, setStep } = useListingFormStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [registeredId, setRegisteredId] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");

  function formatPrice(value: number) {
    return value === 0 ? "0" : value.toLocaleString();
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function handleSubmit() {
    // Silent failure 방지: 사진이 하나도 없으면 사용자에게 확인받고 Step6으로 되돌림
    const hasAnyImage = data.images.some(
      (img) => img.file || (img.url && !img.url.startsWith("blob:")),
    );
    if (!hasAnyImage) {
      const proceed = confirm(
        "등록된 사진이 없습니다.\n사진 없이 등록하시면 매수자 관심도가 크게 낮아집니다.\n\n사진을 추가하시겠습니까?\n(확인: 사진 단계로 이동 / 취소: 사진 없이 계속 등록)",
      );
      if (proceed) {
        setStep(6);
        return;
      }
    }

    setLoading(true);
    setError("");

    const uploadedImageUrls: string[] = [];
    const uploadedDocUrls: string[] = [];

    try {
      const totalFiles = data.images.filter((i) => i.file).length + data.documents.filter((d) => d.file).length;
      let uploaded = 0;

      const uploadedImages: { url: string; type: string; sortOrder: number }[] = [];
      for (const img of data.images) {
        if (img.file) {
          setUploadProgress(`이미지 업로드 중... ${++uploaded}/${totalFiles}`);
          const formData = new FormData();
          formData.append("file", img.file);
          const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
          if (!uploadRes.ok) throw new Error("이미지 업로드 실패");
          const { url } = await uploadRes.json();
          uploadedImageUrls.push(url);
          uploadedImages.push({ url, type: img.type, sortOrder: img.sortOrder });
        } else if (img.url) {
          uploadedImages.push({ url: img.url, type: img.type, sortOrder: img.sortOrder });
        }
      }

      // 매출증빙자료 업로드
      const uploadedDocs: { url: string; sortOrder: number }[] = [];
      for (const doc of data.documents) {
        if (doc.file) {
          setUploadProgress(`증빙자료 업로드 중... ${++uploaded}/${totalFiles}`);
          const formData = new FormData();
          formData.append("file", doc.file);
          const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
          if (!uploadRes.ok) throw new Error("증빙자료 업로드 실패");
          const { url } = await uploadRes.json();
          uploadedDocUrls.push(url);
          uploadedDocs.push({ url, sortOrder: doc.sortOrder });
        } else if (doc.url) {
          uploadedDocs.push({ url: doc.url, sortOrder: doc.sortOrder });
        }
      }

      setUploadProgress("매물 등록 중...");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          images: uploadedImages,
          documents: uploadedDocs,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await res.json();

      if (!res.ok) {
        // 등록 실패 시 업로드된 이미지 정리
        await cleanupOrphanImages([...uploadedImageUrls, ...uploadedDocUrls]);
        setError(result.error || "등록에 실패했습니다.");
        return;
      }

      setRegisteredId(result.id);
      setShowSuccess(true);
      // 등록 성공 시점에 폼 store 즉시 reset
      // → 결제 진행·"나중에 하기"·중간 이탈 어느 경로로도 다음 매물 등록 시 fresh state
      // (기존엔 "나중에 하기"에만 reset() 있어서, 결제 경로로 가면 store 찌꺼기 남아 다음 /sell 진입 시 Step7 복원됨)
      reset();
    } catch (err) {
      // 예외 발생 시 업로드된 이미지 정리
      await cleanupOrphanImages([...uploadedImageUrls, ...uploadedDocUrls]);
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("요청 시간이 초과되었습니다. 다시 시도해주세요.");
      } else {
        setError("등록 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
      setUploadProgress("");
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
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 overflow-y-auto py-8"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 체크 아이콘 */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* 제목 & 설명 */}
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
              매물 등록 완료!
            </h2>
            <p className="text-center text-gray-600 mb-6">
              매물이 성공적으로 등록되었습니다.<br />지금 바로 노출됩니다.
            </p>

            {/* 구분선 */}
            <div className="h-px bg-gradient-to-r from-transparent via-green-500 to-transparent mb-6"></div>

            {/* 광고 상품 인라인 선택 */}
            <div className="mb-6">
              <AdProductInlineSelect
                scope="LISTING"
                listingId={registeredId}
                onSkip={() => { reset(); router.push(`/listings/${registeredId}`); }}
                skipLabel="나중에 하기 (내 매물로 이동)"
              />
            </div>

            {/* 푸시 알림 + PWA 설치 유도 */}
            <div>
              <PushPromptCard accentColor="blue" showGrantedText customTitle="구매자 연락을 놓치지 마세요" customDescription="관심 표시·채팅 문의를 실시간으로 받아볼 수 있어요" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">등록 확인</h2>
        <p className="text-sm text-gray-500 mb-6">입력한 내용을 확인하고 등록해주세요</p>

      <div className="space-y-4">
        <Section title="위치정보" onEdit={() => setStep(1)}>
          <Info label="주소" value={data.addressRoad || data.addressJibun} />
          {data.addressDetail && <Info label="상세주소" value={data.addressDetail} />}
        </Section>

        <Section title="업종 / 금액" onEdit={() => setStep(2)}>
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

        <Section title="기본정보" onEdit={() => setStep(3)}>
          <Info label="운영형태" value={data.brandType === "FRANCHISE" ? "프랜차이즈" : "개인매장"} />
          {data.storeName && <Info label="상호명" value={data.storeName} />}
          {data.areaPyeong && <Info label="면적" value={`${data.areaPyeong}평 (${data.areaSqm}m²)`} />}
          {data.currentFloor && (
            <Info label="층수" value={`${data.isBasement ? "지하 " : ""}${data.currentFloor}층 / ${data.totalFloor}층`} />
          )}
          {data.themes.length > 0 && <Info label="테마" value={data.themes.join(", ")} />}
        </Section>

        {data.monthlyRevenue !== null && (
          <Section title="수익정보" onEdit={() => setStep(4)}>
            <Info label="월매출" value={`${formatPrice(data.monthlyRevenue)}만원`} />
            {data.monthlyProfit !== null && (
              <Info label="월순이익" value={`${formatPrice(data.monthlyProfit)}만원`} />
            )}
          </Section>
        )}

        {data.description && (
          <Section title="매물설명" onEdit={() => setStep(5)}>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.description}</p>
          </Section>
        )}

        <Section title="사진" onEdit={() => setStep(6)}>
          {data.images.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {data.images.map((img, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden border border-gray-200 relative">
                  <Image src={img.url} alt={`매물 사진 ${i + 1} - ${img.type === "EXTERIOR" ? "외부" : img.type === "INTERIOR" ? "내부" : img.type === "KITCHEN" ? "주방" : "기타"}`} fill className="object-cover" sizes="150px" />
                  <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5">
                    {img.type === "EXTERIOR" ? "외부" : img.type === "INTERIOR" ? "내부" : img.type === "KITCHEN" ? "주방" : "기타"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">등록된 사진 없음</p>
          )}
        </Section>

        <Section title="연락처" onEdit={() => setStep(6)}>
          <Info label="연락처 공개" value={data.contactPublic ? "공개" : "채팅만"} />
          {data.contactPublic && data.contactPhone && (
            <Info label="전화번호" value={formatPhone(data.contactPhone)} />
          )}
        </Section>
      </div>

      {/* 매출 매입자료 연동 (개발 중 - 플래그로 숨김) */}
      {SHOW_REVENUE_SYNC && (
        <div className="mt-6 pt-6 border-t border-line">
          <h3 className="text-base font-semibold text-gray-900 mb-1">매출 매입자료 연동 (선택)</h3>
          <p className="text-sm text-gray-500 mb-4">매출 데이터를 연동하면 매물 신뢰도가 높아집니다</p>

          <div className="space-y-3">
            {SERVICES.map((svc) => (
              <div
                key={svc.key}
                className="flex items-center gap-4 p-4 border rounded-lg border-gray-200 bg-gray-50 opacity-60"
              >
                <div className="text-3xl shrink-0">{svc.icon}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900">{svc.title} (준비 중)</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{svc.description}</p>
                </div>
                <button
                  onClick={() => showToast("해당 서비스는 준비 중입니다. 곧 오픈됩니다.")}
                  disabled
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-300 text-gray-500 cursor-not-allowed"
                >
                  준비 중
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-700 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-green-800">
                외부 매출 자료 연동 기능은 현재 개발 중입니다. 빠른 시일 내에 오픈 예정입니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 광고 안내 배너 (매출자료 숨김 시 대체) */}
      {!SHOW_REVENUE_SYNC && (
        <div className="mt-6 pt-6 border-t border-line">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <span className="text-xl shrink-0">💎</span>
              <div>
                <h4 className="text-sm font-semibold text-green-900 mb-1">
                  등록 완료 후 광고 상품을 선택할 수 있어요
                </h4>
                <p className="text-xs text-green-700">
                  매물을 등록하면 곧바로 광고 상품을 선택해 더 많은 예비 창업자에게 노출할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-gray-900 text-white rounded-xl shadow-lg text-sm font-medium z-50">
          {toast}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button
          onClick={onPrev}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          이전
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-8 py-3 bg-green-700 text-cream rounded-full font-medium hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (uploadProgress || "등록 중...") : "매물 등록하기"}
        </button>
      </div>
    </div>
    </>
  );
}

function Section({ title, children, onEdit }: { title: string; children: React.ReactNode; onEdit?: () => void }) {
  return (
    <div className="border-b border-line pb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {onEdit && (
          <button
            onClick={onEdit}
            className="text-xs text-green-700 hover:text-green-800"
          >
            수정
          </button>
        )}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex text-sm">
      <span className="w-20 text-gray-400 shrink-0">{label}</span>
      <span className="text-gray-700">{value || "-"}</span>
    </div>
  );
}
