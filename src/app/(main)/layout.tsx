import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CompareBar from "@/components/listing/CompareBar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
      <Footer />
      <CompareBar />
    </>
  );
}
