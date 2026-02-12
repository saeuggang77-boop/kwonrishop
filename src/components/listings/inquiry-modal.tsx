"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare, Send, X } from "lucide-react";
import Link from "next/link";

interface InquiryModalProps {
  listingId: string;
  sellerId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function InquiryModal({ listingId, sellerId, isOpen, onClose }: InquiryModalProps) {
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  // Don't render if not open
  if (!isOpen) return null;

  // Don't show for own listing
  if (session?.user?.id === sellerId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 10 || !privacyConsent) return;

    setStatus("sending");
    try {
      const body: Record<string, string> = { listingId, message: message.trim() };
      if (senderName.trim()) body.senderName = senderName.trim();
      if (senderPhone.trim()) body.senderPhone = senderPhone.trim();

      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setStatus("sent");
        setMessage("");
        setSenderName("");
        setSenderPhone("");
        setPrivacyConsent(false);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const handleClose = () => {
    if (status === "sent") {
      setStatus("idle");
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-navy px-6 py-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-white" />
            <h3 className="font-bold text-white">문의하기</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Not logged in */}
          {!session ? (
            <div className="py-4 text-center">
              <p className="text-sm text-gray-600">
                로그인 후 문의할 수 있습니다
              </p>
              <Link
                href="/login"
                className="mt-4 inline-block rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
              >
                로그인
              </Link>
            </div>
          ) : status === "sent" ? (
            /* Success state */
            <div className="py-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <MessageSquare className="h-7 w-7 text-green-600" />
              </div>
              <p className="mt-4 text-lg font-semibold text-green-700">
                문의가 전송되었습니다
              </p>
              <p className="mt-2 text-sm text-gray-500">
                판매자가 확인 후 연락드릴 예정입니다.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-6 rounded-lg bg-gray-100 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                닫기
              </button>
            </div>
          ) : (
            /* Inquiry form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Sender Name (optional) */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  이름 <span className="text-xs text-gray-400">(선택)</span>
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="이름을 입력해주세요"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-navy/20 placeholder:text-gray-400"
                />
              </div>

              {/* Sender Phone (optional) */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  연락처 <span className="text-xs text-gray-400">(선택)</span>
                </label>
                <input
                  type="tel"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="010-1234-5678"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-navy/20 placeholder:text-gray-400"
                />
              </div>

              {/* Message (required) */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  문의 내용 <span className="text-xs text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="매물에 대해 궁금한 점을 작성해주세요 (최소 10자)"
                  rows={5}
                  minLength={10}
                  maxLength={1000}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-navy/20 placeholder:text-gray-400"
                />
                <p className="mt-1 text-right text-xs text-gray-400">
                  {message.length}/1,000
                </p>
              </div>

              {/* Error message */}
              {status === "error" && (
                <p className="text-xs text-red-500">
                  전송에 실패했습니다. 다시 시도해주세요.
                </p>
              )}

              {/* Privacy Consent */}
              <label className="flex items-start gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={privacyConsent}
                  onChange={(e) => setPrivacyConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-navy focus:ring-navy"
                />
                <span>개인정보 수집 및 이용에 동의합니다. (필수)</span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={
                  status === "sending" ||
                  !message.trim() ||
                  message.trim().length < 10 ||
                  !privacyConsent
                }
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-sm font-medium text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {status === "sending" ? "전송 중..." : "문의 보내기"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
