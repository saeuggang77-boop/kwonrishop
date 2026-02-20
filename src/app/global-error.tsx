"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "'Noto Sans KR', sans-serif" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#1B3A5C", marginBottom: "16px" }}>
            오류가 발생했습니다
          </h2>
          <p style={{ color: "#6b7280", marginBottom: "24px" }}>
            문제가 지속되면 고객센터에 문의해주세요.
          </p>
          <button
            onClick={() => reset()}
            style={{ padding: "10px 24px", borderRadius: "8px", background: "#1B3A5C", color: "white", border: "none", cursor: "pointer", fontWeight: 600 }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
