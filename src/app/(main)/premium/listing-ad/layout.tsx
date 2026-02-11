import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "프리미엄 광고 - 권리샵",
  description: "매물을 상단에 노출하세요",
};

export default function ListingAdLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
