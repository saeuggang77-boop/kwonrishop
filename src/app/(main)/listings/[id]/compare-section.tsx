"use client";

import { CompareButton } from "@/components/listings/compare-button";
import type { CompareItem } from "@/lib/compare-context";

export function CompareSection({ listing }: { listing: CompareItem }) {
  return <CompareButton listing={listing} variant="detail" />;
}
