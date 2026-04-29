import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CompareBar from "@/components/listing/CompareBar";
import BottomNav from "@/components/layout/BottomNav";
import ContextualFAB from "@/components/layout/ContextualFAB";

export const metadata: Metadata = {
  title: "권리샵 - 상가직거래 플랫폼",
  description: "권리금 직거래로 중개수수료 없이 상가를 사고파세요. 매물등록부터 거래완료까지 안전하게. 상가임대, 점포매매, 창업, 프랜차이즈 정보를 한곳에서 확인하세요.",
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-3.5rem)] pb-16 md:pb-0">{children}</main>
      <Footer />
      <CompareBar />
      <ContextualFAB />
      <BottomNav />
    </>
  );
}
