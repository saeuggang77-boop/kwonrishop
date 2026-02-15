"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, ArrowUp, Flame, RefreshCw } from "lucide-react";
import { PaidServiceModal } from "./paid-service-modal";

interface PaidServiceDropdownProps {
  listingId: string;
  listingTitle: string;
}

type ServiceType = "JUMP_UP" | "URGENT_TAG" | "AUTO_REFRESH";

const MENU_ITEMS: {
  type: ServiceType;
  icon: typeof ArrowUp;
  label: string;
}[] = [
  {
    type: "JUMP_UP",
    icon: ArrowUp,
    label: "점프업 (₩5,000)",
  },
  {
    type: "URGENT_TAG",
    icon: Flame,
    label: "급매 등록 (₩9,900~)",
  },
  {
    type: "AUTO_REFRESH",
    icon: RefreshCw,
    label: "자동 갱신 (₩79,000/30일)",
  },
];

export function PaidServiceDropdown({
  listingId,
  listingTitle,
}: PaidServiceDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState<ServiceType | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function handleMenuItemClick(type: ServiceType) {
    setIsOpen(false);
    setModalType(type);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500
          hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
        aria-label="유료 서비스 메뉴"
        aria-expanded={isOpen}
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl
            shadow-lg border border-gray-200 py-1.5 z-20 animate-in fade-in
            slide-in-from-top-1 duration-150"
        >
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              유료 서비스
            </p>
          </div>
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuItemClick(item.type);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm
                  text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalType && (
        <PaidServiceModal
          listingId={listingId}
          listingTitle={listingTitle}
          type={modalType}
          onClose={() => setModalType(null)}
        />
      )}
    </div>
  );
}
