import type { Metadata, Viewport } from "next";
import { Geist, Fraunces } from "next/font/google";
import localFont from "next/font/local";
import SessionProvider from "@/components/providers/SessionProvider";
import SkipLink from "@/components/ui/SkipLink";
import Toaster from "@/components/ui/Toaster";
import PushNotificationManager from "@/components/PushNotificationManager";
import InstallPwaPrompt from "@/components/InstallPwaPrompt";
import PushPermissionPrompt from "@/components/PushPermissionPrompt";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://www.kwonrishop.com"),
  title: "권리샵 - 상가직거래 플랫폼",
  description: "권리금 직거래로 중개수수료 없이 상가를 사고파세요. 매물등록부터 거래완료까지 안전하게. 상가임대, 점포매매, 창업, 프랜차이즈 정보를 한곳에서 확인하세요.",
  keywords: ["권리금", "상가매매", "점포매매", "상가직거래", "창업", "프랜차이즈", "상가임대", "권리금직거래", "중개수수료없이", "상가매물"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "권리샵 - 상가직거래 플랫폼",
    description: "권리금 직거래로 중개수수료 없이 상가를 사고파세요. 매물등록부터 거래완료까지 안전하게.",
    siteName: "권리샵",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "권리샵 - 상가직거래 플랫폼",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "권리샵 - 상가직거래 플랫폼",
    description: "권리금 직거래로 중개수수료 없이 상가를 사고파세요.",
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1F3F2E",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png?v=2" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        {/* Toss Payments 도메인 미리 연결 (DNS/TLS 사전 준비로 결제 진입 속도 향상) */}
        <link rel="preconnect" href="https://js.tosspayments.com" crossOrigin="" />
        <link rel="preconnect" href="https://api.tosspayments.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://js.tosspayments.com" />
        <link rel="dns-prefetch" href="https://api.tosspayments.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "권리샵",
              "url": "https://www.kwonrishop.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://www.kwonrishop.com/listings?keyword={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            }),
          }}
        />
      </head>
      <body className={`${pretendard.variable} ${geist.variable} ${fraunces.variable} font-sans antialiased bg-cream text-ink`}>
        <SkipLink />
        <SessionProvider>
          <PushNotificationManager />
          <InstallPwaPrompt />
          <PushPermissionPrompt />
          <div id="main-content">{children}</div>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
