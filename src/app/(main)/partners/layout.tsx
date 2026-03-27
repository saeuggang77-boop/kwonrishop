import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "협력업체 - 권리샵",
  description: "점포 창업 및 운영에 필요한 검증된 협력업체를 찾아보세요. 인테리어, 간판, 법률, 세무 등 다양한 서비스.",
  openGraph: {
    title: "협력업체 - 권리샵",
    description: "점포 창업 및 운영에 필요한 검증된 협력업체를 찾아보세요. 인테리어, 간판, 법률, 세무 등 다양한 서비스.",
  },
};

export default function PartnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
