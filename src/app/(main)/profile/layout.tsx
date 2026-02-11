import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "내 프로필 - 권리샵",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
