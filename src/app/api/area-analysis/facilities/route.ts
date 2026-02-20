import { NextRequest, NextResponse } from "next/server";

const FACILITY_CATEGORIES = [
  { code: "SW8", emoji: "🚇", name: "지하철역" },
  { code: "BT1", emoji: "🚌", name: "버스정류장" },
  { code: "BK9", emoji: "🏦", name: "은행/ATM" },
  { code: "PK6", emoji: "🅿️", name: "주차장" },
  { code: "HP8", emoji: "🏥", name: "병원/약국" },
];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat, lng required" }, { status: 400 });
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const results = await Promise.all(
      FACILITY_CATEGORIES.map(async (cat) => {
        const url = new URL("https://dapi.kakao.com/v2/local/search/category.json");
        url.searchParams.set("category_group_code", cat.code);
        url.searchParams.set("x", lng);
        url.searchParams.set("y", lat);
        url.searchParams.set("radius", "2000");
        url.searchParams.set("size", "5");
        url.searchParams.set("sort", "distance");

        const res = await fetch(url.toString(), {
          headers: { Authorization: `KakaoAK ${apiKey}` },
        });

        if (!res.ok) return { ...cat, places: [], count: 0 };

        const data = await res.json();
        const places = (data.documents ?? []).map((d: any) => ({
          name: d.place_name,
          distance: Number(d.distance),
          address: d.road_address_name || d.address_name,
        }));

        return { ...cat, places, count: data.meta?.total_count ?? places.length };
      })
    );

    return NextResponse.json(results, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800" },
    });
  } catch {
    return NextResponse.json({ error: "시설 정보 조회 실패" }, { status: 500 });
  }
}
