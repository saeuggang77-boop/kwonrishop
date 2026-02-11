import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "매물 비교 - 권리샵",
  description: "관심 매물을 나란히 비교하세요",
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
