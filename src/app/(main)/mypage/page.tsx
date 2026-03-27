"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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
  partnerService: { id: string; status: string; companyName: string; serviceType: string; viewCount: number; tier: string } | null;
  franchiseBrand: { id: string; brandName: string; tier: string } | null;
  equipmentCount: number;
  equipmentFavoriteCount: number;
}

export default function MyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<MyData | null>(null);
  const [loading, setLoading] = useState(true);

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
    }
  }, [status, router]);

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
            <Image src={data.user.image} alt="" width={56} height={56} className="rounded-full" />
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

      {/* 내 매물 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900">내 매물</h3>
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
          <Link
            href={`/listings/${data.listing.id}`}
            className="block p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <p className="font-medium text-gray-900 dark:text-gray-100">{data.listing.storeName || "매물"}</p>
            <div className="flex gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
              <span>상태: {data.listing.status}</span>
              <span>조회 {data.listing.viewCount}</span>
              <span>관심 {data.listing.favoriteCount}</span>
            </div>
          </Link>
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

      {/* 내 서비스 (PARTNER) */}
      {data.user.role === "PARTNER" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">내 서비스</h3>
            {data.partnerService && (
              <Link
                href="/partners/edit"
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

      {/* 메뉴 */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {data.listing && (
          <Link href="/mypage/stats" className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
            <span className="text-sm font-medium text-gray-700">매물 통계</span>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </Link>
        )}
        <Link href="/mypage/favorites" className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
          <span className="text-sm font-medium text-gray-700">관심매물</span>
          <span className="text-sm text-gray-400">{data.favoriteCount + data.equipmentFavoriteCount}건</span>
        </Link>
        <Link href="/chat" className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
          <span className="text-sm font-medium text-gray-700">채팅</span>
          <span className="text-sm text-gray-400">{data.chatCount}건</span>
        </Link>
        <Link href="/mypage/reviews" className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
          <span className="text-sm font-medium text-gray-700">리뷰</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full text-left px-5 py-4 text-sm font-medium text-red-500 hover:bg-gray-50"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
