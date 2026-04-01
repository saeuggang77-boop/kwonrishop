import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import localFont from "next/font/local";
import SessionProvider from "@/components/providers/SessionProvider";
import ThemeProvider from "@/components/providers/ThemeProvider";
import SkipLink from "@/components/ui/SkipLink";
import Toaster from "@/components/ui/Toaster";
import PushNotificationManager from "@/components/PushNotificationManager";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "권리샵 - 상가직거래 플랫폼",
  description: "권리금 직거래로 중개수수료 없이 상가를 사고파세요. 매물등록부터 거래완료까지 안전하게. 상가임대, 점포매매, 창업, 프랜차이즈 정보를 한곳에서 확인하세요.",
  keywords: ["권리금", "상가매매", "점포매매", "상가직거래", "창업", "프랜차이즈", "상가임대", "권리금직거래", "중개수수료없이", "상가매물"],
  openGraph: {
    title: "권리샵 - 상가직거래 플랫폼",
    description: "권리금 직거래로 중개수수료 없이 상가를 사고파세요. 매물등록부터 거래완료까지 안전하게.",
    siteName: "권리샵",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "권리샵 - 상가직거래 플랫폼",
    description: "권리금 직거래로 중개수수료 없이 상가를 사고파세요.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var t = localStorage.getItem('theme');
                if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
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
      <body className={`${pretendard.variable} ${geist.variable} font-sans antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
        <SkipLink />
        <SessionProvider>
          <ThemeProvider>
            <PushNotificationManager />
            <div id="main-content">{children}</div>
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
