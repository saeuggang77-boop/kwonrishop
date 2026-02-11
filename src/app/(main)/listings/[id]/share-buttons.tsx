"use client";

import { useState, useEffect } from "react";
import { Link2, Check } from "lucide-react";

interface ShareButtonsProps {
  listingId: string;
  title: string;
}

export function ShareButtons({ listingId }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/listings/${listingId}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // clipboard write failed silently
    }
  };

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopyLink}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-green-600">복사됨</span>
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4" />
            <span>링크 복사</span>
          </>
        )}
      </button>
    </div>
  );
}
