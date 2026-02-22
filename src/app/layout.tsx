import type { Metadata } from "next";
import { Noto_Sans_KR, Montserrat } from "next/font/google";
import { Providers } from "./providers";
import { PwaInstallBanner } from "@/components/pwa-install-banner";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://kwonrishop.com"),
  title: {
    default: "권리샵 | 안전한 점포 직거래",
    template: "%s | 권리샵",
  },
  description:
    "점포 매물 검색, 권리 진단, 안심 직거래를 한 곳에서. 상가 양도양수, 권리금 분석, 매출 인증까지 안전하게 거래하세요.",
  keywords: ["점포", "상가", "권리금", "양도양수", "직거래", "권리진단서", "창업", "매물"],
  icons: {
    icon: "/logos/krw_shop_favicon.png",
    apple: "/icons/icon-192x192.png",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "권리샵",
    "mobile-web-app-capable": "yes",
  },
  openGraph: {
    title: "권리샵 | 안전한 점포 직거래",
    description:
      "점포 매물 검색, 권리 진단, 안심 직거래를 한 곳에서.",
    siteName: "권리샵",
    locale: "ko_KR",
    type: "website",
    images: [{ url: "/logos/krw_shop_logo_full.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "권리샵 | 안전한 점포 직거래",
    description: "점포 매물 검색, 권리 진단, 안심 직거래를 한 곳에서.",
    images: ["/logos/krw_shop_logo_full.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body
        className={`${notoSansKr.variable} ${montserrat.variable} antialiased`}
      >
        <a href="#main-content" className="skip-to-content">
          본문으로 건너뛰기
        </a>
        <Providers>
          <div id="main-content">{children}</div>
          <PwaInstallBanner />
        </Providers>
      </body>
    </html>
  );
}
