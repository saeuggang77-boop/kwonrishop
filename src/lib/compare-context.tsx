"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useSession } from "next-auth/react";

const MAX_COMPARE_FREE = 2;
const MAX_COMPARE_PRO = 4;
const STORAGE_KEY = "kwonrishop_compare";

export interface CompareItem {
  id: string;
  title: string;
  businessCategory: string;
  city: string;
  district: string;
  thumbnail: string | null;
  price: string;
  monthlyRent: string | null;
  premiumFee: string | null;
  managementFee?: string | null;
  monthlyRevenue: string | null;
  monthlyProfit?: string | null;
  areaM2: number | null;
  areaPyeong: number | null;
  floor: number | null;
  safetyGrade: string | null;
  isPremium: boolean;
  premiumRank: number;
  storeType?: string;
}

interface CompareContextValue {
  items: CompareItem[];
  add: (item: CompareItem) => boolean;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  isFull: boolean;
  maxCompare: number;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const tier = session?.user?.subscriptionTier ?? "FREE";
  const maxCompare = (tier === "PRO" || tier === "EXPERT") ? MAX_COMPARE_PRO : MAX_COMPARE_FREE;

  const [items, setItems] = useState<CompareItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount — keep all stored items (up to 4)
  // so that upgrading tier reveals previously added items
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CompareItem[];
        if (Array.isArray(parsed)) setItems(parsed.slice(0, MAX_COMPARE_PRO));
      }
    } catch {}
    setLoaded(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  const add = useCallback(
    (item: CompareItem) => {
      if (items.length >= maxCompare) return false;
      if (items.some((i) => i.id === item.id)) return false;
      setItems((prev) => [...prev, item]);
      return true;
    },
    [items, maxCompare]
  );

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const has = useCallback((id: string) => items.some((i) => i.id === id), [items]);

  return (
    <CompareContext.Provider
      value={{ items, add, remove, clear, has, isFull: items.length >= maxCompare, maxCompare }}
    >
      {children}
    </CompareContext.Provider>
  );
}
