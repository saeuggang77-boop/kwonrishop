"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { formatKRW } from "@/lib/utils/format";
import { BUSINESS_CATEGORY_LABELS } from "@/lib/utils/constants";

interface MarkerData {
  id: string;
  title: string;
  businessCategory: string;
  price: string;
  monthlyRent: string | null;
  premiumFee: string | null;
  isPremium: boolean;
  safetyGrade: string | null;
  images: { url: string; thumbnailUrl: string | null }[];
}

interface Props {
  marker: MarkerData;
  onClose: () => void;
}

export function ListingMarkerPopup({ marker, onClose }: Props) {
  const thumb =
    marker.images[0]?.thumbnailUrl ?? marker.images[0]?.url ?? "/placeholder-listing.jpg";
  const categoryLabel =
    BUSINESS_CATEGORY_LABELS[marker.businessCategory] ?? marker.businessCategory;

  return (
    <div
      style={{
        position: "relative",
        width: "260px",
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        overflow: "hidden",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: "relative", height: "120px", overflow: "hidden" }}>
        <img
          src={thumb}
          alt={marker.title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {marker.isPremium && (
          <span
            style={{
              position: "absolute",
              top: "8px",
              left: "8px",
              background: "linear-gradient(135deg, #F59E0B, #EF4444)",
              color: "white",
              fontSize: "10px",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "4px",
            }}
          >
            PREMIUM
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: "rgba(0,0,0,0.5)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "white",
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: "10px 12px" }}>
        {/* Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#6366F1",
              background: "#EEF2FF",
              padding: "1px 6px",
              borderRadius: "4px",
            }}
          >
            {categoryLabel}
          </span>
          {marker.safetyGrade && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color:
                  marker.safetyGrade === "A"
                    ? "#059669"
                    : marker.safetyGrade === "B"
                      ? "#2563EB"
                      : "#6B7280",
                background:
                  marker.safetyGrade === "A"
                    ? "#ECFDF5"
                    : marker.safetyGrade === "B"
                      ? "#EFF6FF"
                      : "#F9FAFB",
                padding: "1px 6px",
                borderRadius: "4px",
              }}
            >
              등급 {marker.safetyGrade}
            </span>
          )}
        </div>

        {/* Title */}
        <p
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#1B3A5C",
            margin: "0 0 6px 0",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {marker.title}
        </p>

        {/* Price */}
        <div style={{ fontSize: "12px", color: "#374151" }}>
          <span style={{ fontWeight: 600 }}>보증금 {formatKRW(Number(marker.price))}</span>
          {marker.monthlyRent && Number(marker.monthlyRent) > 0 && (
            <span style={{ color: "#6B7280" }}>
              {" "}
              / 월세 {formatKRW(Number(marker.monthlyRent))}
            </span>
          )}
        </div>
        {marker.premiumFee && Number(marker.premiumFee) > 0 && (
          <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>
            권리금 {formatKRW(Number(marker.premiumFee))}
          </div>
        )}

        {/* Detail link */}
        <Link
          href={`/listings/${marker.id}`}
          style={{
            display: "block",
            marginTop: "8px",
            textAlign: "center",
            fontSize: "12px",
            fontWeight: 600,
            color: "white",
            background: "#1B3A5C",
            padding: "6px",
            borderRadius: "6px",
            textDecoration: "none",
          }}
        >
          상세보기
        </Link>
      </div>

      {/* Bottom arrow */}
      <div
        style={{
          position: "absolute",
          bottom: "-8px",
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: "8px solid white",
        }}
      />
    </div>
  );
}
