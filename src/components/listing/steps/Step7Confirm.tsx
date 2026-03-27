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
  const [dataConsent, setDataConsent] = useState(false);
  const [activeModal, setActiveModal] = useState<ServiceKey | null>(null);
  const [connectedServices, setConnectedServices] = useState<Set<ServiceKey>>(new Set());
  const [toast, setToast] = useState("");

  function formatPrice(value: number) {
    return value === 0 ? "0" : value.toLocaleString();
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  function handleServiceConnect(key: ServiceKey) {
    showToast("서비스 연동 기능은 곧 오픈 예정입니다");
    setConnectedServices((prev) => new Set(prev).add(key));
    setActiveModal(null);
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
              className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${
                connectedServices.has(svc.key)
                  ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20"
                  : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"
              }`}
            >
              <div className="text-3xl shrink-0">{svc.icon}</div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">{svc.title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{svc.description}</p>
              </div>
              {connectedServices.has(svc.key) ? (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span className="text-xs font-medium">연동</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (!dataConsent) {
                      showToast("매출 데이터 활용 동의를 먼저 체크해주세요");
                      return;
                    }
                    setActiveModal(svc.key);
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  연동하기
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-start space-x-2">
          <input
            type="checkbox"
            id="data-consent"
            checked={dataConsent}
            onChange={(e) => setDataConsent(e.target.checked)}
            className="mt-0.5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="data-consent" className="text-sm text-gray-600 dark:text-gray-400">
            매출 데이터 제3자 제공 및 활용에 동의합니다
          </label>
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

      {/* 연동 모달 */}
      {activeModal && (
        <ServiceModal
          serviceKey={activeModal}
          onClose={() => setActiveModal(null)}
          onConnect={() => handleServiceConnect(activeModal)}
        />
      )}
    </div>
  );
}

function ServiceModal({
  serviceKey,
  onClose,
  onConnect,
}: {
  serviceKey: ServiceKey;
  onClose: () => void;
  onConnect: () => void;
}) {
  const [tab, setTab] = useState<"simple" | "cert">("simple");

  const isHometax = serviceKey === "hometax";
  const isCreditFinance = serviceKey === "creditfinance";

  const titles: Record<ServiceKey, string> = {
    hometax: "홈택스 연동",
    creditfinance: "여신금융협회 연동",
    baemin: "배달의민족 연동",
    yogiyo: "요기요 연동",
    coupangeats: "쿠팡이츠 연동",
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{titles[serviceKey]}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          {isHometax && (
            <>
              <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1 mb-5">
                <button
                  onClick={() => setTab("simple")}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    tab === "simple"
                      ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  간편인증
                </button>
                <button
                  onClick={() => setTab("cert")}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    tab === "cert"
                      ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  공동인증서
                </button>
              </div>

              {tab === "simple" ? (
                <div className="space-y-3">
                  <InputField label="사업자등록번호" placeholder="000-00-00000" />
                  <InputField label="생년월일" placeholder="YYYYMMDD" />
                  <InputField label="대표자명" placeholder="대표자 이름" />
                  <InputField label="휴대폰 번호" placeholder="010-0000-0000" />
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">공동인증서를 USB에 삽입한 후<br />인증서 선택 버튼을 눌러주세요</p>
                </div>
              )}
            </>
          )}

          {!isHometax && (
            <div className="space-y-3">
              <InputField label="아이디" placeholder={`${titles[serviceKey].replace(" 연동", "")} 아이디`} />
              <InputField label="비밀번호" placeholder="비밀번호" type="password" />
              {isCreditFinance && (
                <button className="w-full text-center text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 py-2">
                  연동 불가 매장인 경우 →
                </button>
              )}
            </div>
          )}

          <button
            onClick={onConnect}
            className="w-full mt-5 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm"
          >
            연동하기
          </button>
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
      />
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
