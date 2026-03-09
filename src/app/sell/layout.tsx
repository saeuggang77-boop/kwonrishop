import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "매물등록 - 권리샵",
};

export default function SellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">{children}</div>
    </div>
  );
}
