"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "@/lib/toast";
import { enablePushNotification, disablePushNotification } from "@/components/PushNotificationManager";
import { DashboardPlanCard } from "@/components/promotion/PromotionCTA";

interface SellerReportItem {
  id: string;
  listingId: string;
  listingName: string;
  createdAt: string;
}

interface MyData {
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
    phone: string | null;
    createdAt: string;
  };
  verification: { verified: boolean; businessName: string | null } | null;
  listing: { id: string; status: string; storeName: string | null; viewCount: number; favoriteCount: number } | null;
  favoriteCount: number;
  chatCount: number;
  unreadChatCount: number;
  partnerService: { id: string; status: string; companyName: string; serviceType: string; viewCount: number; tier: string } | null;
  franchiseBrand: { id: string; brandName: string; tier: string } | null;
  equipmentCount: number;
  equipmentFavoriteCount: number;
  activeListingAd: {
    name: string;
    expiresAt: string;
    daysLeft: number;
    viewCountAtAdStart: number | null;
  } | null;
}

export default function MyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<MyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bumpSubscription, setBumpSubscription] = useState<{
    id: string;
    frequency: string;
    nextBumpAt: string;
    listingId: string | null;
  } | null>(null);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [sellerReports, setSellerReports] = useState<SellerReportItem[]>([]);
  const [pushStatus, setPushStatus] = useState<"loading" | "granted" | "denied" | "default" | "unsupported">("loading");
  const [pushToggling, setPushToggling] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/mypage");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/mypage")
        .then((r) => r.json())
        .then((d) => { setData(d); setLoading(false); })
        .catch(() => setLoading(false));

      // Fetch seller reports
      fetch("/api/mypage/seller-reports")
        .then((r) => r.json())
        .then((data) => {
          if (data.reports) setSellerReports(data.reports);
        })
        .catch(() => {});

      // Fetch bump subscription
      fetch("/api/bump-subscriptions")
        .then((r) => r.json())
        .then((data) => {
          if (data.subscriptions && data.subscriptions.length > 0) {
            const activeSub = data.subscriptions.find((sub: any) => sub.status === "ACTIVE");
            if (activeSub) {
              setBumpSubscription({
                id: activeSub.id,
                frequency: activeSub.frequency,
                nextBumpAt: activeSub.nextBumpAt,
                listingId: activeSub.listingId,
              });
            }
          }
        })
        .catch(() => {});
    }
  }, [status, router]);

  // 푸시 알림 권한 상태 확인
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      setPushStatus("unsupported");
      return;
    }
    setPushStatus(Notification.permission as "granted" | "denied" | "default");
  }, []);

  const handlePushToggle = useCallback(async () => {
    setPushToggling(true);
    try {
      if (pushStatus === "granted") {
        const success = await disablePushNotification();
        if (success) {
          setPushStatus("default");
          toast.success("푸시 알림이 비활성화되었습니다");
        } else {
          toast.error("푸시 알림 비활성화에 실패했습니다");
        }
      } else {
        const result = await enablePushNotification();
        if (result === "granted") {
          setPushStatus("granted");
          toast.success("푸시 알림이 활성화되었습니다");
        } else if (result === "denied") {
          setPushStatus("denied");
          toast.error("브라우저 설정에서 알림이 차단되어 있습니다. 브라우저 알림 설정을 확인해주세요.");
        } else {
          toast.error("이 브라우저는 푸시 알림을 지원하지 않습니다");
        }
      }
    } catch {
      toast.error("푸시 알림 설정 변경에 실패했습니다");
    } finally {
      setPushToggling(false);
    }
  }, [pushStatus]);

  async function handleCancelSubscription() {
    if (!bumpSubscription) return;

    const confirmed = confirm("정기 끌어올리기 구독을 해지하시겠습니까?\n다음 결제일부터 자동 끌어올리기가 중단됩니다.");
    if (!confirmed) return;

    setCancellingSubscription(true);
    try {
      const res = await fetch(`/api/bump-subscriptions/${bumpSubscription.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("구독이 해지되었습니다");
        setBumpSubscription(null);
      } else {
        toast.error(data.error || "구독 해지 중 오류가 발생했습니다");
      }
    } catch {
      toast.error("구독 해지 중 오류가 발생했습니다");
    } finally {
      setCancellingSubscription(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded-xl" />
          <div className="h-32 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  const roleLabel = {
    BUYER: "예비창업자",
    SELLER: "사장님",
    FRANCHISE: "프랜차이즈 본사",
    PARTNER: "협력업체",
    ADMIN: "관리자",
  }[data.user.role] || data.user.role;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">마이페이지</h1>

      {/* 프로필 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900">프로필</h3>
          <Link
            href="/mypage/edit"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            프로필 수정
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {data.user.image ? (
            <Image src={data.user.image} alt={`${data.user.name || '사용자'} 프로필 사진`} width={56} height={56} className="rounded-full" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold">
              {data.user.name?.[0] || "U"}
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-gray-900">{data.user.name || "사용자"}</h2>
            <p className="text-sm text-gray-500">{data.user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">
              {roleLabel}
            </span>
          </div>
        </div>
      </div>

      {/* 사업자인증 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h3 className="font-bold text-gray-900 mb-3">사업자인증</h3>
        {data.verification?.verified ? (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            인증 완료 {data.verification.businessName && `(${data.verification.businessName})`}
          </div>
        ) : (
          <Link
            href="/verify-business"
            className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700"
          >
            사업자 인증하기
          </Link>
        )}
      </div>

      {/* 플랜 업그레이드 카드 (SELLER만) */}
      {data.user.role === "SELLER" && (
        <div className="mb-4">
          <DashboardPlanCard />
        </div>
      )}

      {/* 내 매물 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">내 매물</h3>
          {data.listing && (
            <Link
              href="/sell/edit"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              매물 수정
            </Link>
          )}
        </div>
        {data.listing ? (
          <div>
            {/* KPI 요약 카드 */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
                <div className="flex justify-center mb-2">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {data.listing.viewCount}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">조회수</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
                <div className="flex justify-center mb-2">
                  <svg className="w-6 h-6 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {data.listing.favoriteCount}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">관심</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
                <div className="flex justify-center mb-2">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {data.chatCount}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">채팅</div>
              </div>
            </div>
            <Link
              href={`/listings/${data.listing.id}`}
              className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <p className="font-medium text-gray-900 dark:text-gray-100">{data.listing.storeName || "매물"}</p>
                {/* 매물 상태 배지 */}
                {data.listing.status === "ACTIVE" && (
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded font-medium">
                    판매중
                  </span>
                )}
                {data.listing.status === "RESERVED" && (
                  <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded font-medium">
                    예약중
                  </span>
                )}
                {data.listing.status === "SOLD" && (
                  <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded font-medium">
                    거래완료
                  </span>
                )}
                {/* 광고 배지 */}
                {data.activeListingAd ? (
                  data.activeListingAd.daysLeft <= 3 && data.activeListingAd.daysLeft > 0 ? (
                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded font-medium">
                      {data.activeListingAd.name} {data.activeListingAd.daysLeft}일 남음 · 만료 임박
                    </span>
                  ) : data.activeListingAd.daysLeft <= 0 ? (
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded font-medium">
                      만료됨
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded font-medium">
                      {data.activeListingAd.name} {data.activeListingAd.daysLeft}일 남음
                    </span>
                  )
                ) : (
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded font-medium">
                    무료
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    조회 {data.listing.viewCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    관심 {data.listing.favoriteCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    채팅 {data.chatCount}건
                  </span>
                </div>
                {data.activeListingAd && data.activeListingAd.viewCountAtAdStart !== null && data.activeListingAd.daysLeft > 0 && (
                  <div className="text-xs">
                    {(() => {
                      const adEffect = data.listing.viewCount - data.activeListingAd.viewCountAtAdStart;
                      return adEffect > 0 ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          광고 효과: +{adEffect}회 조회
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">
                          광고 효과: {adEffect}회 조회
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
            </Link>
            <div className="mt-3">
              {!data.activeListingAd || data.activeListingAd.daysLeft <= 0 ? (
                <Link
                  href="/pricing"
                  className="inline-block w-full px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white text-sm rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 text-center"
                >
                  광고로 노출 올리기
                </Link>
              ) : data.activeListingAd.daysLeft <= 3 ? (
                <Link
                  href="/pricing"
                  className="inline-block w-full px-4 py-2.5 bg-orange-600 dark:bg-orange-500 text-white text-sm rounded-lg font-medium hover:bg-orange-700 dark:hover:bg-orange-600 text-center"
                >
                  광고 연장하기
                </Link>
              ) : (
                <Link
                  href="/mypage/ads"
                  className="inline-block w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 text-center"
                >
                  광고 관리
                </Link>
              )}
            </div>
          </div>
        ) : data.verification?.verified ? (
          <Link
            href="/sell"
            className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700"
          >
            매물 등록하기
          </Link>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">사업자인증 후 매물을 등록할 수 있습니다</p>
        )}
      </div>

      {/* 끌어올리기 구독 (SELLER만, 매물이 있을 때) */}
      {data.user.role === "SELLER" && data.listing && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">🔄 정기 끌어올리기</h3>
          </div>
          {bumpSubscription ? (
            <div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">✅</span>
                    <span className="font-bold text-green-700">구독 활성화</span>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-medium">
                    {bumpSubscription.frequency === "TWICE_WEEKLY" && "주 2회"}
                    {bumpSubscription.frequency === "WEEKDAY_DAILY" && "평일 매일"}
                    {bumpSubscription.frequency === "DAILY" && "매일 1회"}
                    {bumpSubscription.frequency === "TWICE_DAILY" && "매일 2회"}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    다음 끌올: <span className="font-medium text-gray-900">
                      {new Date(bumpSubscription.nextBumpAt).toLocaleString("ko-KR", {
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">자동으로 매물이 최상단에 노출됩니다</p>
                </div>
              </div>
              <button
                onClick={handleCancelSubscription}
                disabled={cancellingSubscription}
                className="mt-3 w-full px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancellingSubscription ? "처리 중..." : "구독 해지하기"}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                정기 끌어올리기로 항상 상단 노출을 유지하세요!
              </p>
              <Link
                href={`/pricing?listingId=${data.listing.id}#subscription`}
                className="inline-block w-full px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 text-center"
              >
                구독 상품 보기
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 내 서비스 (PARTNER) */}
      {data.user.role === "PARTNER" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">내 서비스</h3>
            {data.partnerService && (
              <Link
                href="/partners/register?edit=true"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                서비스 수정
              </Link>
            )}
          </div>
          {data.partnerService ? (
            <Link
              href={`/partners/${data.partnerService.id}`}
              className="block p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <p className="font-medium text-gray-900 dark:text-gray-100">{data.partnerService.companyName}</p>
              <div className="flex gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                <span>유형: {data.partnerService.serviceType}</span>
                <span>등급: {data.partnerService.tier}</span>
                <span>조회 {data.partnerService.viewCount}</span>
              </div>
            </Link>
          ) : data.verification?.verified ? (
            <Link
              href="/partners/register"
              className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700"
            >
              서비스 등록하기
            </Link>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">사업자인증 후 서비스를 등록할 수 있습니다</p>
          )}
        </div>
      )}

      {/* 내 브랜드 (FRANCHISE) */}
      {data.user.role === "FRANCHISE" && data.franchiseBrand && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">내 브랜드</h3>
            <Link
              href="/franchise/edit"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              브랜드 수정
            </Link>
          </div>
          <Link
            href={`/franchise/${data.franchiseBrand.id}`}
            className="block p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <p className="font-medium text-gray-900 dark:text-gray-100">{data.franchiseBrand.brandName}</p>
            <div className="flex gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
              <span>등급: {data.franchiseBrand.tier}</span>
            </div>
          </Link>
        </div>
      )}

      {/* 내 집기 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900">내 집기</h3>
          <Link
            href="/equipment/register"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            집기 등록
          </Link>
        </div>
        {data.equipmentCount > 0 ? (
          <Link
            href="/equipment?mine=true"
            className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <p className="font-medium text-gray-900">등록 집기 {data.equipmentCount}건</p>
          </Link>
        ) : (
          <p className="text-sm text-gray-400">등록된 집기가 없습니다</p>
        )}
      </div>

      {/* 내 분석 리포트 (SELLER만) */}
      {data.user.role === "SELLER" && data.listing && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">내 분석 리포트</h3>
          </div>
          {sellerReports.length > 0 ? (
            <div className="space-y-2">
              {sellerReports.map((report) => (
                <Link
                  key={report.id}
                  href={`/reports/seller/${report.listingId}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{report.listingName || "매물 시장분석"}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(report.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                  <span className="text-xs text-blue-600 font-medium">보기</span>
                </Link>
              ))}
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-400 mb-3">아직 구매한 리포트가 없습니다</p>
              <p className="text-xs text-gray-400">매물 상세 페이지에서 시장분석 리포트를 구매할 수 있습니다 (15,000원/건)</p>
            </div>
          )}
        </div>
      )}

      {/* 알림 설정 */}
      {pushStatus !== "loading" && pushStatus !== "unsupported" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-4">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">알림 설정</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">웹 푸시 알림</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {pushStatus === "granted"
                  ? "새 채팅, 가격 변동, 매물 만료 등을 알려드립니다"
                  : pushStatus === "denied"
                  ? "브라우저 설정에서 알림이 차단되어 있습니다"
                  : "활성화하면 중요한 알림을 받을 수 있습니다"}
              </p>
            </div>
            <button
              onClick={handlePushToggle}
              disabled={pushToggling || pushStatus === "denied"}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                pushStatus === "granted" ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  pushStatus === "granted" ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* 메뉴 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
        {(data.user.role === "SELLER" || data.user.role === "FRANCHISE" || data.user.role === "PARTNER") && (
          <>
            <div className="px-5 py-2 bg-gray-50 dark:bg-gray-800">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">매물 관리</p>
            </div>
            {data.listing && (
              <Link href="/mypage/stats" className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">매물 통계</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </Link>
            )}
            <Link href="/mypage/ads" className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">광고 관리</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </Link>
            <div className="px-5 py-2 bg-gray-50 dark:bg-gray-800">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">소통</p>
            </div>
            <Link href="/notifications" className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">알림</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </Link>
            <Link href="/chat" className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">채팅</span>
                {data.unreadChatCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 font-medium">
                    {data.unreadChatCount > 99 ? "99+" : data.unreadChatCount}
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-400">{data.chatCount}건</span>
            </Link>
            <Link href="/mypage/reviews" className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">리뷰</span>
            </Link>
            <div className="px-5 py-2 bg-gray-50 dark:bg-gray-800">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">기타</p>
            </div>
          </>
        )}
        <Link href="/mypage/favorites" className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">관심매물</span>
          <span className="text-sm text-gray-400">{data.favoriteCount + data.equipmentFavoriteCount}건</span>
        </Link>
        {(data.user.role !== "SELLER" && data.user.role !== "FRANCHISE" && data.user.role !== "PARTNER") && (
          <>
            <Link href="/notifications" className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">알림</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </Link>
            <Link href="/chat" className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">채팅</span>
                {data.unreadChatCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 font-medium">
                    {data.unreadChatCount > 99 ? "99+" : data.unreadChatCount}
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-400">{data.chatCount}건</span>
            </Link>
            <Link href="/mypage/reviews" className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">리뷰</span>
            </Link>
          </>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full text-left px-5 py-4 text-sm font-medium text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
