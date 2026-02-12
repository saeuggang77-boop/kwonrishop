import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "권리샵 - 부동산 권리 분석 플랫폼",
    short_name: "권리샵",
    description: "부동산 권리 분석, 매물 등록, 시세 비교를 한 곳에서",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1B3A5C",
    icons: [
      {
        src: "/logos/krw_shop_favicon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logos/krw_shop_logo_symbol.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
