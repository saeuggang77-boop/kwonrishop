"use client";

import { useState } from "react";
import { Phone, MessageSquare } from "lucide-react";
import { InquiryModal } from "@/components/listings/inquiry-modal";

interface MobileBottomBarProps {
  listingId: string;
  sellerId: string;
  contactPhone?: string | null;
  isPhonePublic: boolean;
  diagnosisReportId?: string | null;
}

export function MobileBottomBar({
  listingId,
  sellerId,
  contactPhone,
  isPhonePublic,
  diagnosisReportId,
}: MobileBottomBarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showPhone = isPhonePublic && contactPhone;

  return (
    <>
      <div className="fixed bottom-14 inset-x-0 z-40 border-t border-gray-200 bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          {showPhone && (
            <a
              href={`tel:${contactPhone}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-purple-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-purple-700"
            >
              <Phone className="h-4 w-4" />
              전화
            </a>
          )}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-purple-300 bg-white py-2.5 text-sm font-bold text-purple-700 transition-colors hover:bg-purple-50"
          >
            <MessageSquare className="h-4 w-4" />
            채팅 문의
          </button>
          {!diagnosisReportId ? (
            <a
              href={`/reports/purchase?listingId=${listingId}`}
              className="flex flex-1 items-center justify-center rounded-lg bg-purple-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-purple-700"
            >
              AI 진단서
            </a>
          ) : (
            <a
              href={`/reports/${diagnosisReportId}`}
              className="flex flex-1 items-center justify-center rounded-lg border border-purple-300 bg-white py-2.5 text-sm font-bold text-purple-700 transition-colors hover:bg-purple-50"
            >
              진단서 보기
            </a>
          )}
        </div>
      </div>

      {/* Spacer to prevent content from being hidden behind the fixed bar + tab bar */}
      <div className="h-28 md:hidden" />

      <InquiryModal
        listingId={listingId}
        sellerId={sellerId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
