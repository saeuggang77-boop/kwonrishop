import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/cron-auth";

// 서버리스 콜드 스타트 방지를 위한 워밍 크론
// 주요 API를 주기적으로 호출하여 함수 인스턴스를 따뜻하게 유지
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: "Cron not configured" }, { status: 500 });
  }

  if (!verifyBearerToken(authHeader, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.NEXTAUTH_URL || "https://www.kwonrishop.com";

  const endpoints = [
    "/api/listings?limit=1",
    "/api/partners?limit=1",
    "/api/franchise?limit=1",
    "/api/equipment?limit=1",
  ];

  const results = await Promise.allSettled(
    endpoints.map(async (ep) => {
      const start = Date.now();
      const res = await fetch(`${baseUrl}${ep}`, {
        headers: { "x-warm": "1" },
      });
      return { endpoint: ep, status: res.status, ms: Date.now() - start };
    })
  );

  const summary = results.map((r) =>
    r.status === "fulfilled" ? r.value : { endpoint: "?", error: String(r.reason) }
  );

  return NextResponse.json({
    ok: true,
    warmed: summary.length,
    results: summary,
    timestamp: new Date().toISOString(),
  });
}
