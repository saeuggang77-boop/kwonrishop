"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#111", marginBottom: "0.5rem" }}>
              오류가 발생했습니다
            </h2>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1.5rem" }}>
              일시적인 문제가 발생했습니다. 다시 시도해주세요.
            </p>
            <button
              onClick={reset}
              style={{ padding: "0.625rem 1.5rem", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "0.5rem", fontWeight: 500, cursor: "pointer", fontSize: "0.875rem" }}
            >
              다시 시도
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
