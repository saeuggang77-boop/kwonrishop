import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "배너 관리 - 권리샵",
};

export default function BannersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
