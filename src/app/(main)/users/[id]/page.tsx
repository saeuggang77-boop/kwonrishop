import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ListingCard from "@/components/listing/ListingCard";

interface UserProfileData {
  id: string;
  name: string | null;
  image: string | null;
  createdAt: string;
  role: string;
  listing: any;
}

async function getUserProfile(userId: string): Promise<UserProfileData | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/users/${userId}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return null;
  }
}

export default async function UserProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getUserProfile(params.id);

  if (!user) {
    notFound();
  }

  const memberSince = new Date(user.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });

  const roleLabel = {
    BUYER: "예비창업자",
    SELLER: "사장님",
    FRANCHISE: "프랜차이즈 본사",
    PARTNER: "협력업체",
    ADMIN: "관리자",
  }[user.role] || user.role;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 프로필 헤더 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-6">
            {/* 프로필 이미지 */}
            <div className="flex-shrink-0">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || "사용자"}
                  width={100}
                  height={100}
                  className="rounded-full"
                />
              ) : (
                <div className="w-25 h-25 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-3xl font-bold">
                  {user.name?.[0] || "U"}
                </div>
              )}
            </div>

            {/* 프로필 정보 */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.name || "익명 사용자"}
                </h1>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                  {roleLabel}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                회원 가입: {memberSince}
              </p>

              {/* 채팅하기 버튼 */}
              {user.listing && (
                <Link
                  href={`/chat?listingId=${user.listing.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  채팅하기
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 등록 매물 */}
        {user.listing ? (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">등록 매물</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <ListingCard listing={user.listing} />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <svg
              className="w-12 h-12 text-gray-300 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <p className="text-gray-600">등록된 매물이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
