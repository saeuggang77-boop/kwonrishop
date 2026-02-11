import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "매물 등록 - 권리샵",
  description: "점포 매물을 등록하세요",
};

export default function NewListingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
