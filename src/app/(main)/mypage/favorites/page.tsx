"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ListingCard from "@/components/listing/ListingCard";
import EquipmentCard from "@/components/equipment/EquipmentCard";

type TabType = "listing" | "equipment";

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("listing");
  const [listings, setListings] = useState<Record<string, unknown>[]>([]);
  const [equipment, setEquipment] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [equipLoading, setEquipLoading] = useState(false);
  const [equipLoaded, setEquipLoaded] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/mypage/favorites");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/mypage/favorites?type=listing")
        .then((r) => r.json())
        .then((data) => { setListings(Array.isArray(data) ? data : []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  useEffect(() => {
    if (activeTab === "equipment" && !equipLoaded && status === "authenticated") {
      setEquipLoading(true);
      fetch("/api/mypage/favorites?type=equipment")
        .then((r) => r.json())
        .then((data) => {
          setEquipment(Array.isArray(data) ? data : []);
          setEquipLoaded(true);
          setEquipLoading(false);
        })
        .catch(() => setEquipLoading(false));
    }
  }, [activeTab, equipLoaded, status]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">관심매물</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl aspect-[3/4] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">관심매물</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 max-w-xs">
        <button
          onClick={() => setActiveTab("listing")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
            activeTab === "listing"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          매물 <span className={activeTab === "listing" ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}>{listings.length}</span>
        </button>
        <button
          onClick={() => setActiveTab("equipment")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
            activeTab === "equipment"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          집기 <span className={activeTab === "equipment" ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}>{equipLoaded ? equipment.length : "·"}</span>
        </button>
      </div>

      {/* Listing tab */}
      {activeTab === "listing" && (
        listings.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500">
            <p>관심매물이 없습니다</p>
            <p className="text-sm mt-1">매물 상세에서 하트를 눌러 저장하세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id as string}
                listing={listing as Parameters<typeof ListingCard>[0]["listing"]}
              />
            ))}
          </div>
        )
      )}

      {/* Equipment tab */}
      {activeTab === "equipment" && (
        equipLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl aspect-[3/4] animate-pulse" />
            ))}
          </div>
        ) : equipment.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500">
            <p>관심 집기가 없습니다</p>
            <p className="text-sm mt-1">집기 상세에서 하트를 눌러 저장하세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {equipment.map((item) => (
              <EquipmentCard
                key={item.id as string}
                equipment={item as Parameters<typeof EquipmentCard>[0]["equipment"]}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
