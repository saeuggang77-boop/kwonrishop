import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "권리샵 - 상가 권리금 분석 플랫폼",
    short_name: "권리샵",
    description: "상가 권리금 분석부터 안전한 거래까지",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1B3A5C",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
