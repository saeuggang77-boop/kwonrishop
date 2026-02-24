"use client";

import { useEffect } from "react";
import { useRecentListings } from "@/hooks/use-recent-listings";

interface RecentListingTrackerProps {
  listing: {
    id: string;
    title: string;
    city: string;
    district: string;
    price: bigint | number;
    premiumFee?: bigint | number | null;
    images: { url: string; thumbnailUrl?: string | null }[];
  };
}

export function RecentListingTracker({ listing }: RecentListingTrackerProps) {
  const { addRecent } = useRecentListings();

  useEffect(() => {
    // Track visit on mount
    addRecent({
      id: listing.id,
      title: listing.title,
      city: listing.city,
      district: listing.district,
      price: String(listing.price),
      premiumFee: listing.premiumFee ? String(listing.premiumFee) : null,
      image: listing.images[0]?.thumbnailUrl ?? listing.images[0]?.url ?? null,
    });
  }, [listing, addRecent]);

  return null; // This component renders nothing
}
