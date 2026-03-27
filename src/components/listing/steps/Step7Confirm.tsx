"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useListingFormStore } from "@/store/listingForm";

interface Props {
  onPrev: () => void;
}

export default function Step7Confirm({ onPrev }: Props) {
  const { data, reset } = useListingFormStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function formatPrice(value: number) {
    return value === 0 ? "0" : value.toLocaleString();
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");

    try {
      // 이미지 업로드
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

      // 매물 등록
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          images: uploadedImages,
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
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-1">등록 확인</h2>
      <p className="text-sm text-gray-500 mb-6">입력한 내용을 확인하고 등록해주세요</p>

      <div className="space-y-4">
        {/* 위치 */}
        <Section title="위치정보">
          <Info label="주소" value={data.addressRoad || data.addressJibun} />
          {data.addressDetail && <Info label="상세주소" value={data.addressDetail} />}
        </Section>

        {/* 업종/금액 */}
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

        {/* 기본정보 */}
        <Section title="기본정보">
          <Info label="운영형태" value={data.brandType === "FRANCHISE" ? "프랜차이즈" : "개인매장"} />
          {data.storeName && <Info label="상호명" value={data.storeName} />}
          {data.areaPyeong && <Info label="면적" value={`${data.areaPyeong}평 (${data.areaSqm}m²)`} />}
          {data.currentFloor && (
            <Info label="층수" value={`${data.isBasement ? "지하 " : ""}${data.currentFloor}층 / ${data.totalFloor}층`} />
          )}
          {data.themes.length > 0 && <Info label="테마" value={data.themes.join(", ")} />}
        </Section>

        {/* 추가정보 */}
        {data.monthlyRevenue !== null && (
          <Section title="수익정보">
            <Info label="월매출" value={`${formatPrice(data.monthlyRevenue)}만원`} />
            {data.monthlyProfit !== null && (
              <Info label="월순이익" value={`${formatPrice(data.monthlyProfit)}만원`} />
            )}
          </Section>
        )}

        {/* 설명 */}
        {data.description && (
          <Section title="매물설명">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.description}</p>
          </Section>
        )}

        {/* 사진 */}
        <Section title="사진">
          {data.images.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {data.images.map((img, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden border border-gray-200 relative">
                  <Image src={img.url} alt="" fill className="object-cover" sizes="150px" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">등록된 사진 없음</p>
          )}
        </Section>

        <Section title="연락처">
          <Info label="연락처 공개" value={data.contactPublic ? "공개" : "채팅만"} />
        </Section>
      </div>

      {/* 매출 매입자료 연동 */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-base font-semibold text-gray-900 mb-1">매출 매입자료 연동 (선택)</h3>
        <p className="text-sm text-gray-500 mb-4">매출 데이터를 연동하면 매물 신뢰도가 높아집니다</p>

        <div className="space-y-3">
          <DataConnectionCard
            icon="🏛️"
            title="홈택스"
            description="간편인증으로 매출 데이터 연동"
            disabled
          />
          <DataConnectionCard
            icon="💳"
            title="여신금융협회"
            description="카드매출 데이터 연동"
            disabled
          />
          <DataConnectionCard
            icon="🛵"
            title="배달의민족"
            description="배달 매출 데이터 연동"
            disabled
          />
          <DataConnectionCard
            icon="🍔"
            title="요기요"
            description="배달 매출 데이터 연동"
            disabled
          />
          <DataConnectionCard
            icon="📦"
            title="쿠팡이츠"
            description="배달 매출 데이터 연동"
            disabled
          />
        </div>

        <div className="mt-4 flex items-start space-x-2">
          <input
            type="checkbox"
            id="data-consent"
            disabled
            className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
          />
          <label htmlFor="data-consent" className="text-sm text-gray-500">
            매출 데이터 제3자 제공 및 활용에 동의합니다
          </label>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
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
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "등록 중..." : "매물 등록하기"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 pb-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">{title}</h3>
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

function DataConnectionCard({
  icon,
  title,
  description,
  disabled,
}: {
  icon: string;
  title: string;
  description: string;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="text-3xl shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900">{title}</h4>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        disabled={disabled}
        className="px-4 py-2 text-sm font-medium rounded-lg bg-white border border-gray-300 text-gray-400 cursor-not-allowed"
      >
        준비 중
      </button>
    </div>
  );
}
