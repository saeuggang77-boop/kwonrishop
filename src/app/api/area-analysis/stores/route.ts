import { NextRequest, NextResponse } from "next/server";
import type { StoreStats } from "@/lib/utils/area-analysis";
import { CHART_COLORS } from "@/lib/utils/area-analysis";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radius = searchParams.get("radius") || "500";

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat, lng 좌표가 필요합니다." }, { status: 400 });
  }

  const apiKey = process.env.DATA_GO_KR_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API 키 미설정" }, { status: 500 });
  }

  try {
    const url = new URL("https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInRadius");
    url.searchParams.set("serviceKey", apiKey);
    url.searchParams.set("radius", radius);
    url.searchParams.set("cx", lng); // 경도
    url.searchParams.set("cy", lat); // 위도
    url.searchParams.set("numOfRows", "1000");
    url.searchParams.set("pageNo", "1");
    url.searchParams.set("type", "json");

    const res = await fetch(url.toString());
    if (!res.ok) {
      return NextResponse.json({ error: "상가정보 API 오류" }, { status: 502 });
    }

    const data = await res.json();
    const items = data?.body?.items ?? [];
    const total = data?.body?.totalCount ?? items.length;

    // Aggregate by 업종대분류명
    const categoryMap = new Map<string, number>();
    let openCount = 0;
    let closeCount = 0;

    for (const item of items) {
      const cat = item.indsLclsNm || "기타"; // 업종대분류명
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
      // 상태 (01: 영업중, 03: 폐업)
      if (item.trdStatenm === "영업" || item.trdStateGbn === "01") openCount++;
      if (item.trdStatenm === "폐업" || item.trdStateGbn === "03") closeCount++;
    }

    const byCategory = Array.from(categoryMap.entries())
      .map(([name, count], i) => ({ name, count, color: CHART_COLORS[i % CHART_COLORS.length] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const stats: StoreStats = {
      total,
      byCategory,
      openRate: total > 0 ? Math.round((openCount / total) * 1000) / 10 : 0,
      closeRate: total > 0 ? Math.round((closeCount / total) * 1000) / 10 : 0,
    };

    return NextResponse.json(stats, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800" },
    });
  } catch {
    return NextResponse.json({ error: "상가정보 API 호출 실패" }, { status: 500 });
  }
}
