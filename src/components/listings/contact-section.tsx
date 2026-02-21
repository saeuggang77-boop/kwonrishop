"use client";

import { useState } from "react";
import { Phone, Mail, MessageSquare } from "lucide-react";
import { InquiryModal } from "@/components/listings/inquiry-modal";

interface ContactSectionProps {
  listingId: string;
  sellerId: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  isPhonePublic: boolean;
}

export function ContactSection({
  listingId,
  sellerId,
  contactPhone,
  contactEmail,
  isPhonePublic,
}: ContactSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showPhone = isPhonePublic && contactPhone;
  const showEmail = !!contactEmail;
  const hasPhone = !!contactPhone;

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          연락처
        </p>

        <div className="mt-4 space-y-2">
          {showPhone && (
            <a
              href={`tel:${contactPhone}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
            >
              <Phone className="h-4 w-4" />
              전화 문의
            </a>
          )}

          {!showPhone && hasPhone && (
            <p className="text-center text-sm text-gray-500">
              연락처가 비공개입니다. 아래 문의하기를 이용해주세요.
            </p>
          )}

          {showEmail && (
            <a
              href={`mailto:${contactEmail}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Mail className="h-4 w-4" />
              이메일 문의
            </a>
          )}

          {!hasPhone && !showEmail && (
            <p className="text-center text-sm text-gray-500">
              연락처가 등록되지 않았습니다.
            </p>
          )}
        </div>

        {/* Inquiry Button */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
        >
          <MessageSquare className="h-4 w-4" />
          문의하기
        </button>
      </div>

      {/* Inquiry Modal */}
      <InquiryModal
        listingId={listingId}
        sellerId={sellerId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
