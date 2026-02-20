import { NextRequest, NextResponse } from "next/server";
import { KAKAO_CATEGORY_MAP, type NearbyPlace, type NearbyResult } from "@/lib/utils/area-analysis";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const x = searchParams.get("x"); // longitude
  const y = searchParams.get("y"); // latitude
  const radius = searchParams.get("radius") || "500";

  if (!x || !y) {
    return NextResponse.json({ error: "x, y 좌표가 필요합니다." }, { status: 400 });
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API 키 미설정" }, { status: 500 });
  }

  try {
    // Fetch all categories in parallel
    const entries = Object.entries(KAKAO_CATEGORY_MAP);
    const results = await Promise.all(
      entries.map(async ([key, { code, label }]) => {
        const url = new URL("https://dapi.kakao.com/v2/local/search/category.json");
        url.searchParams.set("category_group_code", code);
        url.searchParams.set("x", x);
        url.searchParams.set("y", y);
        url.searchParams.set("radius", radius);
        url.searchParams.set("size", "15");
        url.searchParams.set("sort", "distance");

        const res = await fetch(url.toString(), {
          headers: { Authorization: `KakaoAK ${apiKey}` },
        });

        if (!res.ok) return { categoryKey: key, categoryLabel: label, count: 0, places: [] };

        const data = await res.json();
        const places: NearbyPlace[] = (data.documents ?? []).map((d: any) => ({
          id: d.id,
          name: d.place_name,
          category: d.category_name,
          categoryKey: key,
          address: d.road_address_name || d.address_name,
          phone: d.phone || "",
          distance: Number(d.distance),
          x: d.x,
          y: d.y,
        }));

        return { categoryKey: key, categoryLabel: label, count: data.meta?.total_count ?? places.length, places } satisfies NearbyResult;
      })
    );

    return NextResponse.json(results, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800" },
    });
  } catch {
    return NextResponse.json({ error: "카카오 API 호출 실패" }, { status: 500 });
  }
}
