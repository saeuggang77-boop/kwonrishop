import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "권리샵 - 상가직거래 플랫폼";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 120,
            fontWeight: 900,
            marginBottom: 20,
          }}
        >
          권리샵
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 48,
            fontWeight: 400,
            opacity: 0.9,
          }}
        >
          상가직거래 플랫폼
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
