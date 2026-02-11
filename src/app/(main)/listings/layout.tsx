import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "점포 찾기 - 권리샵",
  description: "전국 점포 매물을 검색하고 비교하세요",
};

export default function ListingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
