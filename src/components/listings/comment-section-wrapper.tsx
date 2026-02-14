"use client";

import dynamic from "next/dynamic";

const CommentSection = dynamic(
  () =>
    import("@/components/listings/comment-section").then(
      (m) => m.CommentSection,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="mt-8 flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-navy" />
      </div>
    ),
  },
);

export function CommentSectionWrapper({
  listingId,
  sellerId,
}: {
  listingId: string;
  sellerId: string;
}) {
  return <CommentSection listingId={listingId} sellerId={sellerId} />;
}
