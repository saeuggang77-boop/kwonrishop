"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { EQUIPMENT_CATEGORY_LABELS, EQUIPMENT_CONDITION_LABELS, TRADE_METHOD_LABELS } from "@/lib/constants";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { toast } from "@/lib/toast";

const KakaoMap = dynamic(() => import("@/components/map/KakaoMap"), {
  loading: () => <div className="h-[300px] md:h-[400px] bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />,
});


const CrossSellSection = dynamic(() => import("@/components/shared/CrossSellSection"), {
  ssr: false,
});

interface EquipmentDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  negotiable: boolean;
  condition: string;
  category: string;
  tradeMethod: string;
  brand: string | null;
  modelName: string | null;
  purchaseYear: number | null;
  quantity: number;
  addressRoad: string | null;
  addressJibun: string | null;
  addressDetail: string | null;
  latitude: number | null;
  longitude: number | null;
  viewCount: number;
  favoriteCount: number;
  createdAt: string;
  images: { id: string; url: string }[];
  user: {
    id: string;
    name: string | null;
    image: string | null;
    businessVerification?: { verified: boolean } | null;
  };
  favorited?: boolean;
}

export default function EquipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const id = params.id as string;

  const [equipment, setEquipment] = useState<EquipmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    fetch(`/api/equipment/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          router.push("/equipment");
          return;
        }
        setEquipment(data);
        setFavorited(!!data.favorited);
        setLoading(false);
      })
      .catch(() => {
        router.push("/equipment");
      });
  }, [id, router]);

  useEffect(() => {
    if (equipment) {
      document.title = `${equipment.title} - 집기장터 - 권리샵`;
    }
  }, [equipment]);

  async function handleFavorite() {
    if (!session) {
      router.push("/login");
      return;
    }
    const res = await fetch(`/api/equipment/${id}/favorite`, { method: "POST" });
    const data = await res.json();
    setFavorited(data.favorited);
    if (equipment) {
      setEquipment({
        ...equipment,
        favoriteCount: equipment.favoriteCount + (data.favorited ? 1 : -1),
      });
    }
  }

  async function handleChat() {
    if (!session) {
      router.push("/login");
      return;
    }
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ equipmentId: id }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/chat?roomId=${data.chatRoomId}`);
      } else {
        toast.error(data.error || "채팅방 생성에 실패했습니다.");
      }
    } catch {
      toast.error("채팅 요청 중 오류가 발생했습니다.");
    }
  }

  async function handleReport() {
    if (!session) {
      router.push("/login");
      return;
    }
    if (!reportReason.trim()) {
      toast.info("신고 사유를 입력해주세요.");
      return;
    }
    setReporting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: id, targetType: "EQUIPMENT", reason: reportReason }),
      });
      if (res.ok) {
        toast.success("신고가 접수되었습니다.");
        setReportOpen(false);
        setReportReason("");
      } else {
        const data = await res.json();
        toast.error(data.error || "신고에 실패했습니다.");
      }
    } catch {
      toast.error("신고 요청 중 오류가 발생했습니다.");
    } finally {
      setReporting(false);
    }
  }

  function formatPrice(price: number): string {
    if (price === 0) return "무료 나눔";
    if (price >= 10000) {
      const man = Math.floor(price / 10000);
      const remainder = price % 10000;
      return remainder > 0
        ? `${man.toLocaleString()}만 ${remainder.toLocaleString()}원`
        : `${man.toLocaleString()}만원`;
    }
    return `${price.toLocaleString()}원`;
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!equipment) return null;

  const isFree = equipment.price === 0;
  const conditionColors: Record<string, string> = {
    EXCELLENT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    GOOD: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    FAIR: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <Breadcrumb items={[{ label: "집기장터", href: "/equipment" }, { label: equipment.title }]} />
      {/* 이미지 갤러리 */}
      <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden mb-4 -mx-4 md:mx-0 md:rounded-xl rounded-none">
        {equipment.images.length > 0 ? (
          <>
            <Image
              src={equipment.images[currentImage].url}
              alt={`${equipment.title} 사진 ${currentImage + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 896px"
              className="object-cover"
              priority={currentImage === 0}
            />
            {equipment.images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImage((p) => (p > 0 ? p - 1 : equipment.images.length - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 md:w-8 md:h-8 bg-black/40 text-white rounded-full flex items-center justify-center active:bg-black/60 touch-manipulation"
                >
                  &lt;
                </button>
                <button
                  onClick={() => setCurrentImage((p) => (p < equipment.images.length - 1 ? p + 1 : 0))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 md:w-8 md:h-8 bg-black/40 text-white rounded-full flex items-center justify-center active:bg-black/60 touch-manipulation"
                >
                  &gt;
                </button>
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {currentImage + 1} / {equipment.images.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600 text-sm md:text-lg">
            사진 없음
          </div>
        )}
      </div>

      {/* 제목 + 상태 배지 */}
      <div className="flex items-start gap-2 mb-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex-1">{equipment.title}</h1>
        <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ${conditionColors[equipment.condition] || "bg-gray-100 text-gray-800"}`}>
          {EQUIPMENT_CONDITION_LABELS[equipment.condition] || equipment.condition}
        </span>
      </div>

      {/* 가격 */}
      <div className="mb-4">
        <span className={`text-2xl font-bold ${isFree ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
          {formatPrice(equipment.price)}
        </span>
        {isFree && (
          <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
            무료 나눔
          </span>
        )}
        {equipment.negotiable && !isFree && (
          <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full">
            협의가능
          </span>
        )}
      </div>

      {/* 정보 그리드 */}
      <Section title="상세 정보">
        <InfoGrid>
          <InfoItem label="카테고리" value={EQUIPMENT_CATEGORY_LABELS[equipment.category] || equipment.category} />
          <InfoItem label="상태" value={EQUIPMENT_CONDITION_LABELS[equipment.condition] || equipment.condition} />
          {equipment.brand && <InfoItem label="브랜드" value={equipment.brand} />}
          {equipment.modelName && <InfoItem label="모델명" value={equipment.modelName} />}
          {equipment.purchaseYear && <InfoItem label="구매연도" value={`${equipment.purchaseYear}년`} />}
          <InfoItem label="수량" value={`${equipment.quantity}개`} />
          <InfoItem label="거래방식" value={TRADE_METHOD_LABELS[equipment.tradeMethod] || equipment.tradeMethod} />
        </InfoGrid>
      </Section>

      {/* 설명 */}
      {equipment.description && (
        <Section title="상품 설명">
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            {equipment.description}
          </p>
        </Section>
      )}

      {/* 위치 */}
      {equipment.latitude && equipment.longitude && (
        <Section title="거래 위치">
          <div className="space-y-3">
            <KakaoMap
              latitude={equipment.latitude}
              longitude={equipment.longitude}
              level={3}
              className="h-[300px] md:h-[400px]"
              showInfoWindow={true}
              address={equipment.addressRoad || ""}
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {equipment.addressRoad}
              {equipment.addressDetail && ` ${equipment.addressDetail}`}
            </p>
          </div>
        </Section>
      )}

      {!equipment.latitude && equipment.addressRoad && (
        <Section title="거래 위치">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {equipment.addressRoad}
            {equipment.addressDetail && ` ${equipment.addressDetail}`}
          </p>
        </Section>
      )}

      {/* 판매자 정보 */}
      <Section title="판매자">
        <div className="flex items-center gap-3">
          {equipment.user.image ? (
            <Image src={equipment.user.image} alt="" width={40} height={40} className="rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold">
              {equipment.user.name?.[0] || "U"}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900 dark:text-white">{equipment.user.name || "판매자"}</p>
              {equipment.user.businessVerification?.verified && (
                <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] font-medium rounded">
                  사업자인증
                </span>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* 크로스셀 추천 */}
      <CrossSellSection type="equipment" id={id} />

      {/* 목록으로 */}
      <div className="mt-6 text-center">
        <Link href="/equipment" className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
          목록으로 돌아가기
        </Link>
      </div>

      {/* 하단 액션 바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 z-10 md:static md:border-0 md:p-0 md:mt-6">
        <div className="max-w-3xl mx-auto flex items-center gap-2 md:gap-3">
          <button
            onClick={handleFavorite}
            className={`min-w-[60px] px-3 md:px-4 py-3 rounded-xl border font-medium transition-colors text-sm md:text-base ${
              favorited
                ? "border-red-300 dark:border-red-700 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
                : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100"
            }`}
          >
            {favorited ? "♥" : "♡"} <span className="hidden sm:inline">{equipment.favoriteCount}</span>
          </button>
          <button
            onClick={async () => {
              const url = `${window.location.origin}/equipment/${id}`;
              if (navigator.share) {
                try { await navigator.share({ title: equipment.title, url }); } catch {}
              } else {
                try {
                  await navigator.clipboard.writeText(url);
                  toast.success("링크가 복사되었습니다.");
                } catch { toast.error("링크 복사에 실패했습니다."); }
              }
            }}
            className="min-w-[60px] px-3 md:px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 transition-colors text-sm md:text-base font-medium"
            aria-label="공유하기"
          >
            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          <button
            onClick={() => setReportOpen(true)}
            className="min-w-[60px] px-3 md:px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 transition-colors text-sm md:text-base font-medium"
            aria-label="신고하기"
          >
            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </button>
          <button
            onClick={handleChat}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium text-center hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm md:text-base"
          >
            채팅하기
          </button>
        </div>
      </div>

      {/* 신고 모달 */}
      {reportOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setReportOpen(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl p-6 z-50">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">신고하기</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="신고 사유를 입력해주세요"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setReportOpen(false)}
                className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleReport}
                disabled={reporting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {reporting ? "처리 중..." : "신고하기"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* 메타 */}
      <div className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">
        조회 {equipment.viewCount} · 관심 {equipment.favoriteCount} · {new Date(equipment.createdAt).toLocaleDateString("ko-KR")}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-4 border-b border-gray-100 dark:border-gray-700">
      <h2 className="font-bold text-gray-900 dark:text-white mb-3">{title}</h2>
      {children}
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">{children}</div>;
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex text-sm">
      <span className="w-20 sm:w-16 text-gray-400 dark:text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-700 dark:text-gray-300">{value}</span>
    </div>
  );
}
