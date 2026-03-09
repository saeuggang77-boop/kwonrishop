"use client";

import { useEffect } from "react";

interface JsonLdProps {
  data: Record<string, unknown>;
}

export default function JsonLd({ data }: JsonLdProps) {
  useEffect(() => {
    // Create script element
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);

    // Add to head
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      document.head.removeChild(script);
    };
  }, [data]);

  return null;
}
