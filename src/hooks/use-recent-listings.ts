"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "kwonrishop:recent-listings";
const MAX_ITEMS = 20;

export interface RecentListing {
  id: string;
  title: string;
  city: string;
  district: string;
  price: string;
  premiumFee: string | null;
  image: string | null;
  visitedAt: number;
}

export function useRecentListings() {
  const [recents, setRecents] = useState<RecentListing[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentListing[];
        setRecents(parsed);
      }
    } catch (e) {
      console.error("[useRecentListings] Failed to load:", e);
    }
  }, []);

  const addRecent = (listing: Omit<RecentListing, "visitedAt">) => {
    try {
      const newItem: RecentListing = {
        ...listing,
        visitedAt: Date.now(),
      };

      // Remove if already exists, then add to front
      const filtered = recents.filter((r) => r.id !== listing.id);
      const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);

      setRecents(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("[useRecentListings] Failed to add:", e);
    }
  };

  const getRecents = () => recents;

  const clearRecents = () => {
    try {
      setRecents([]);
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("[useRecentListings] Failed to clear:", e);
    }
  };

  return { addRecent, getRecents, clearRecents, recents };
}
