"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface BlockedUser {
  id: string;
  createdAt: string;
  blocked: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export default function BlockedUsersPage() {
  const { status } = useSession();
  const router = useRouter();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/mypage/blocked");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/users/block")
        .then((r) => r.json())
        .then((data) => {
          setBlockedUsers(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  async function handleUnblock(blockedId: string) {
    setUnblocking(blockedId);
    try {
      const res = await fetch(`/api/users/block?blockedId=${blockedId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBlockedUsers((prev) => prev.filter((b) => b.blocked.id !== blockedId));
      }
    } catch {
      // 무시
    } finally {
      setUnblocking(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">차단 관리</h1>
      </div>

      {blockedUsers.length === 0 ? (
        <div className="bg-cream rounded-3xl border border-line p-8 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <p className="text-sm text-gray-500">차단한 사용자가 없습니다.</p>
        </div>
      ) : (
        <div className="bg-cream rounded-3xl border border-line divide-y divide-gray-100">
          {blockedUsers.map((block) => (
            <div key={block.id} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                {block.blocked.image ? (
                  <Image
                    src={block.blocked.image}
                    alt={block.blocked.name || "사용자"}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-bold">
                    {block.blocked.name?.[0] || "?"}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {block.blocked.name || "알 수 없는 사용자"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(block.createdAt).toLocaleDateString("ko-KR")} 차단
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleUnblock(block.blocked.id)}
                disabled={unblocking === block.blocked.id}
                className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                {unblocking === block.blocked.id ? "해제 중..." : "차단 해제"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
