"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { useListingFormStore } from "@/store/listingForm";
import { formatPhoneInput } from "@/lib/utils";

const IMAGE_TYPES = [
  { value: "EXTERIOR", label: "외부" },
  { value: "INTERIOR", label: "내부" },
  { value: "KITCHEN", label: "주방" },
  { value: "OTHER", label: "기타" },
];

const UPLOAD_SLOTS = [
  { type: "EXTERIOR", label: "외부사진", required: true, icon: "\u{1F3EA}" },
  { type: "INTERIOR", label: "내부사진", required: true, icon: "\u{1F3E0}" },
  { type: "KITCHEN", label: "주방사진", required: false, icon: "\u{1F373}" },
];

const TYPE_COLORS: Record<string, { bg: string; border: string; lightBg: string; text: string; hoverBorder: string }> = {
  EXTERIOR: { bg: "bg-orange-500", border: "border-orange-300 dark:border-orange-700", lightBg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-500 dark:text-orange-400", hoverBorder: "hover:border-orange-400" },
  INTERIOR: { bg: "bg-blue-500", border: "border-blue-300 dark:border-blue-700", lightBg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-500 dark:text-blue-400", hoverBorder: "hover:border-blue-400" },
  KITCHEN: { bg: "bg-purple-500", border: "border-purple-300 dark:border-purple-700", lightBg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-500 dark:text-purple-400", hoverBorder: "hover:border-purple-400" },
  OTHER: { bg: "bg-gray-500", border: "border-gray-300 dark:border-gray-600", lightBg: "", text: "text-gray-400 dark:text-gray-500", hoverBorder: "hover:border-gray-400" },
};

const PHOTO_GUIDES = [
  {
    label: "외부사진",
    desc: "간판, 출입구가 보이도록",
    icon: (
      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
      </svg>
    ),
  },
  {
    label: "내부(홀)사진",
    desc: "테이블, 좌석 배치 전경",
    icon: (
      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
      </svg>
    ),
  },
  {
    label: "내부(주방)사진",
    desc: "주방 설비, 조리 공간",
    icon: (
      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
      </svg>
    ),
  },
];

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

export default function Step6Photos({ onNext, onPrev }: Props) {
  const { data, updateData } = useListingFormStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [pendingType, setPendingType] = useState<string>("OTHER");
  const [phoneLoading, setPhoneLoading] = useState(true);

  const hasExterior = data.images.some((img) => img.type === "EXTERIOR");
  const hasInterior = data.images.some((img) => img.type === "INTERIOR");
  const photoRequirementMet = hasExterior && hasInterior;

  const wasRefreshed = data.images.length === 0 && data.documents.length === 0;

  // 유저 전화번호 조회
  useEffect(() => {
    fetch("/api/mypage")
      .then((r) => r.json())
      .then((d) => {
        const phone = d.user?.phone || "";
        if (phone && !data.contactPhone) {
          updateData({ contactPhone: formatPhoneInput(phone) });
        }
      })
      .catch(() => {})
      .finally(() => setPhoneLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 페이지 이탈 경고 (사진/문서가 있을 때)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (data.images.length > 0 || data.documents.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [data.images.length, data.documents.length]);

  function handleSlotClick(type: string) {
    setPendingType(type);
    fileInputRef.current?.click();
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const remaining = 10 - data.images.length;
    const MAX_SIZE = 10 * 1024 * 1024;
    const validFiles = files.filter((f) => f.size <= MAX_SIZE);
    if (validFiles.length < files.length) {
      const skipped = files.length - validFiles.length;
      alert(`${skipped}개 파일이 10MB를 초과하여 제외되었습니다.`);
    }
    const filesToAdd = validFiles.slice(0, remaining);
    const newImages = filesToAdd.map((file, i) => ({
      file,
      url: URL.createObjectURL(file),
      type: pendingType,
      sortOrder: data.images.length + i,
    }));
    updateData({ images: [...data.images, ...newImages] });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(index: number) {
    const img = data.images[index];
    if (img?.url?.startsWith("blob:")) URL.revokeObjectURL(img.url);
    const updated = data.images.filter((_, i) => i !== index);
    updateData({ images: updated });
  }

  function updateImageType(index: number, type: string) {
    const updated = data.images.map((img, i) =>
      i === index ? { ...img, type } : img,
    );
    updateData({ images: updated });
  }

  function handleDocSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const docRemaining = 20 - data.documents.length;
    const filesToAdd = files.slice(0, docRemaining);
    if (filesToAdd.length < files.length) {
      alert(`매출 증빙자료는 최대 20장까지 가능합니다.`);
    }
    const newDocs = filesToAdd.map((file, i) => ({
      file,
      url: URL.createObjectURL(file),
      sortOrder: data.documents.length + i,
    }));
    updateData({ documents: [...data.documents, ...newDocs] });
    if (docInputRef.current) docInputRef.current.value = "";
  }

  function removeDoc(index: number) {
    const doc = data.documents[index];
    if (doc?.url?.startsWith("blob:")) URL.revokeObjectURL(doc.url);
    const updated = data.documents.filter((_, i) => i !== index);
    updateData({ documents: updated });
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">사진 / 연락처</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">매물 사진을 등록하고 연락처 공개 여부를 설정해주세요</p>

      {wasRefreshed && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800 rounded-lg flex gap-3">
          <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">새로고침으로 인해 이미지가 초기화되었습니다</p>
            <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
              이전에 업로드한 사진은 브라우저 새로고침으로 인해 삭제되었습니다. 다시 업로드해주세요.
              <br />
              <span className="font-medium">작성 중 페이지 이탈 시 경고 메시지가 표시되니 참고해주세요.</span>
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* 촬영 가이드 */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">촬영 가이드</p>
          <div className="grid grid-cols-3 gap-2">
            {PHOTO_GUIDES.map((guide) => (
              <div
                key={guide.label}
                className="flex flex-col items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 border-dashed rounded-xl"
              >
                {guide.icon}
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{guide.label}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{guide.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-red-500 font-medium">
            * 내부 사진, 외부 사진 각각 1장 이상 필수 첨부
          </p>
        </div>

        {/* 사진 업로드 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              매물 사진 <span className="text-gray-400 dark:text-gray-500">(최대 10장, 장당 10MB)</span>
            </label>
            <span className="text-sm text-gray-400 dark:text-gray-500">{data.images.length}/10</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* 업로드된 사진 */}
            {data.images.map((img, i) => {
              const colors = TYPE_COLORS[img.type] || TYPE_COLORS.OTHER;
              const typeLabel = IMAGE_TYPES.find((t) => t.value === img.type)?.label || "기타";
              return (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                  <Image
                    src={img.url}
                    alt={`사진 ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 33vw, 200px"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center text-sm"
                  >
                    X
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 flex items-center">
                    <span className={`px-2 py-1 text-white text-[11px] font-semibold ${colors.bg} rounded-tr-lg`}>
                      {typeLabel}
                    </span>
                    <select
                      value={img.type}
                      onChange={(e) => updateImageType(i, e.target.value)}
                      className="flex-1 bg-black/50 text-white text-xs py-1 px-1 border-none outline-none backdrop-blur-sm"
                    >
                      {IMAGE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}

            {/* 유형별 업로드 슬롯 (해당 유형 사진이 없을 때만 표시) */}
            {UPLOAD_SLOTS.filter((slot) => !data.images.some((img) => img.type === slot.type)).map((slot) => {
              const colors = TYPE_COLORS[slot.type];
              return (
                <button
                  key={slot.type}
                  type="button"
                  onClick={() => handleSlotClick(slot.type)}
                  className={`aspect-square rounded-lg border-2 border-dashed ${colors.border} ${colors.lightBg} flex flex-col items-center justify-center ${colors.hoverBorder} hover:shadow-sm transition-all cursor-pointer`}
                >
                  <span className="text-2xl mb-1 opacity-70">{slot.icon}</span>
                  <svg className={`w-5 h-5 ${colors.text} mb-1 opacity-60`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className={`text-xs font-medium ${colors.text}`}>{slot.label}</span>
                  {slot.required ? (
                    <span className="text-[10px] text-red-400 font-medium mt-0.5">필수</span>
                  ) : (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">선택</span>
                  )}
                </button>
              );
            })}

            {/* 일반 추가 버튼 */}
            {data.images.length < 10 && (
              <button
                type="button"
                onClick={() => handleSlotClick("OTHER")}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 hover:border-blue-400 hover:text-blue-400 transition-colors"
              >
                <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs">추가</span>
              </button>
            )}
          </div>

          {/* 사진 유형 필수 체크 */}
          {data.images.length > 0 && !photoRequirementMet && (
            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
                {!hasExterior && !hasInterior
                  ? "외부 사진 1장, 내부 사진 1장 이상 필요합니다. 사진 유형을 선택해주세요."
                  : !hasExterior
                    ? "외부 사진이 1장 이상 필요합니다. 사진 유형을 '외부'로 변경해주세요."
                    : "내부 사진이 1장 이상 필요합니다. 사진 유형을 '내부'로 변경해주세요."}
              </p>
            </div>
          )}
        </div>

        {/* 매출 증빙자료 */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              매출 증빙자료
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold rounded">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                매출인증
              </span>
            </label>
          </div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              증빙자료를 올리면 매출인증 뱃지가 달리고, 문의가 3배 높아집니다
            </p>
            <span className="text-sm text-gray-400 dark:text-gray-500">{data.documents.length}/20</span>
          </div>

          <input
            ref={docInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            multiple
            onChange={handleDocSelect}
            className="hidden"
          />

          <div className="flex flex-wrap gap-3">
            {data.documents.map((doc, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                <Image src={doc.url} alt={`증빙 ${i + 1}`} fill className="object-cover" sizes="80px" />
                <button
                  type="button"
                  onClick={() => removeDoc(i)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center text-[10px]"
                >
                  X
                </button>
              </div>
            ))}
            {data.documents.length < 20 && (
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 hover:border-blue-400 hover:text-blue-400 transition-colors"
              >
                <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-[10px]">추가</span>
              </button>
            )}
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">JPG, PNG 형식만 가능 · 장당 10MB</p>
        </div>

        {/* 연락처 공개 */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">연락처 공개 여부</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateData({ contactPublic: true })}
              className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-colors ${
                data.contactPublic
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              공개
            </button>
            <button
              type="button"
              onClick={() => updateData({ contactPublic: false })}
              className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-colors ${
                !data.contactPublic
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              비공개
            </button>
          </div>

          {/* 공개 선택 시 전화번호 입력 */}
          {data.contactPublic && (
            <div className="mt-3">
              {phoneLoading ? (
                <p className="text-xs text-gray-400">연락처 확인 중...</p>
              ) : (
                <input
                  type="tel"
                  value={data.contactPhone}
                  onChange={(e) => updateData({ contactPhone: formatPhoneInput(e.target.value) })}
                  placeholder="010-1234-5678"
                  className="w-full px-3 py-3 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          )}

          {/* 공개 시 전화번호 미입력 경고 */}
          {data.contactPublic && !phoneLoading && !data.contactPhone && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
              전화번호를 입력해야 매물 상세에 연락처가 노출됩니다
            </p>
          )}

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            {data.contactPublic
              ? "매물 상세에 전화번호가 표시되어 바로 연락받을 수 있습니다"
              : "전화번호 없이 채팅으로 연락받습니다. 새 메시지는 이메일과 알림으로 알려드립니다"}
          </p>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={onPrev}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          이전
        </button>
        <button
          onClick={onNext}
          disabled={data.images.length === 0 || !photoRequirementMet}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          다음
        </button>
      </div>
    </div>
  );
}
