import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "협력업체 | 권리샵",
  description: "인테리어, 간판, 청소, 회계, 법률 등 창업에 필요한 전문 협력업체를 찾아보세요.",
  keywords: ["협력업체", "인테리어", "세무", "법무", "마케팅", "간판", "창업서비스", "점포인테리어", "상가인테리어"],
  alternates: {
    canonical: "https://www.kwonrishop.com/partners",
  },
  openGraph: {
    title: "협력업체 | 권리샵",
    description: "인테리어, 간판, 청소, 회계, 법률 등 창업에 필요한 전문 협력업체를 찾아보세요.",
    url: "https://www.kwonrishop.com/partners",
  },
};

export default function PartnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
