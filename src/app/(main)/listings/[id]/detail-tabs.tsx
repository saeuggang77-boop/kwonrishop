"use client";

import { useState, useEffect, useCallback } from "react";

const TABS = [
  { id: "listing-info", label: "매물정보" },
  { id: "revenue-analysis", label: "수익분석" },
  { id: "market-comparison", label: "주변시세" },
  { id: "location-info", label: "위치정보" },
];

export function DetailTabs() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  useEffect(() => {
    const sections = TABS.map((t) => document.getElementById(t.id)).filter(
      Boolean,
    ) as HTMLElement[];
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveTab(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const handleClick = useCallback((tabId: string) => {
    const el = document.getElementById(tabId);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, []);

  return (
    <div className="sticky top-14 z-30 -mx-4 border-b border-gray-200 bg-white/95 px-4 backdrop-blur-sm">
      <div className="flex gap-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleClick(tab.id)}
            className={`relative px-5 py-3.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-mint"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-mint" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
