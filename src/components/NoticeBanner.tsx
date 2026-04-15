"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Notice {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function NoticeBanner() {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const res = await fetch("/api/admin/notices?active=true&limit=1");
        if (!res.ok) return;
        const data = await res.json();
        if (data.length > 0) {
          setNotice(data[0]);
        }
      } catch (error) {
        console.error("공지사항 불러오기 실패:", error);
      }
    };

    fetchNotice();
  }, []);

  if (!notice || dismissed) return null;

  return (
    <div className="bg-green-50 border-b border-green-200">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-green-700 font-bold text-sm flex-shrink-0">
              📢 공지
            </span>
            <p className="text-gray-900 font-medium truncate">{notice.title}</p>
            <Link
              href={`/community?tag=공지`}
              className="text-green-700 hover:text-green-700 text-sm font-medium flex-shrink-0"
            >
              더보기 →
            </Link>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            aria-label="닫기"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
