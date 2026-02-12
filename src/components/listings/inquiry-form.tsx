"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare, Send } from "lucide-react";
import Link from "next/link";

interface InquiryFormProps {
  listingId: string;
  sellerId: string;
}

export function InquiryForm({ listingId, sellerId }: InquiryFormProps) {
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  // Don't show for own listing
  if (session?.user?.id === sellerId) return null;

  // Not logged in
  if (!session) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-xs font-medium text-gray-500">문의하기</p>
        <p className="mt-3 text-sm text-gray-500">
          로그인 후 판매자에게 문의할 수 있습니다.
        </p>
        <Link
          href="/login"
          className="mt-3 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
        >
          로그인
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !privacyConsent) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, message: message.trim() }),
      });

      if (res.ok) {
        setStatus("sent");
        setMessage("");
        setPrivacyConsent(false);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <MessageSquare className="mx-auto h-8 w-8 text-green-600" />
        <p className="mt-2 font-medium text-green-700">문의가 전송되었습니다</p>
        <p className="mt-1 text-sm text-green-600">판매자가 확인 후 연락드릴 예정입니다.</p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-3 text-sm text-green-700 hover:underline"
        >
          추가 문의하기
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <p className="text-xs font-medium text-gray-500">문의하기</p>
      <form onSubmit={handleSubmit} className="mt-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="매물에 대해 궁금한 점을 작성해주세요..."
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-mint focus:ring-2 focus:ring-mint/20 placeholder:text-gray-400"
          maxLength={1000}
        />
        {status === "error" && (
          <p className="mt-1 text-xs text-red-500">전송에 실패했습니다. 다시 시도해주세요.</p>
        )}
        <label className="mt-3 flex items-start gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={privacyConsent}
            onChange={(e) => setPrivacyConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-mint focus:ring-mint"
          />
          <span>
            개인정보 수집 및 이용에 동의합니다. (필수)
          </span>
        </label>
        <button
          type="submit"
          disabled={status === "sending" || !message.trim() || !privacyConsent}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {status === "sending" ? "전송 중..." : "문의 보내기"}
        </button>
      </form>
    </div>
  );
}
