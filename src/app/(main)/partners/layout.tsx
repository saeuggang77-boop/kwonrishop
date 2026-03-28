import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "협력업체 - 권리샵",
  description: "인테리어, 세무, 법무, 마케팅 등 창업에 필요한 전문 협력업체를 찾아보세요. 점포 창업 및 운영에 필요한 검증된 서비스 제공업체.",
  keywords: ["협력업체", "인테리어", "세무", "법무", "마케팅", "간판", "창업서비스", "점포인테리어", "상가인테리어"],
  openGraph: {
    title: "협력업체 - 권리샵",
    description: "창업에 필요한 전문 협력업체를 찾아보세요. 인테리어, 세무, 법무, 마케팅 등 검증된 서비스.",
  },
};

export default function PartnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
