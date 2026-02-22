"use client";

import { useState } from "react";
import { Phone, MessageSquare } from "lucide-react";
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
  isPhonePublic,
}: ContactSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showPhone = isPhonePublic && contactPhone;

  return (
    <>
      <div className="space-y-2">
        {showPhone && (
          <a
            href={`tel:${contactPhone}`}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-700"
          >
            <Phone className="h-4 w-4" />
            전화 문의
          </a>
        )}

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-purple-300 bg-white px-4 py-2.5 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-50"
        >
          <MessageSquare className="h-4 w-4" />
          채팅 문의
        </button>
      </div>

      <InquiryModal
        listingId={listingId}
        sellerId={sellerId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
