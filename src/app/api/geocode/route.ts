import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const url = new URL("https://dapi.kakao.com/v2/local/search/address.json");
    url.searchParams.set("query", address);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `KakaoAK ${apiKey}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Geocode failed" }, { status: 502 });
    }

    const data = await res.json();
    const doc = data.documents?.[0];

    if (!doc) {
      // Fallback to keyword search
      const kwUrl = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
      kwUrl.searchParams.set("query", address);

      const kwRes = await fetch(kwUrl.toString(), {
        headers: { Authorization: `KakaoAK ${apiKey}` },
      });

      if (kwRes.ok) {
        const kwData = await kwRes.json();
        const kwDoc = kwData.documents?.[0];
        if (kwDoc) {
          return NextResponse.json({
            lat: parseFloat(kwDoc.y),
            lng: parseFloat(kwDoc.x),
          }, {
            headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" },
          });
        }
      }

      return NextResponse.json({ error: "No results" }, { status: 404 });
    }

    return NextResponse.json({
      lat: parseFloat(doc.y),
      lng: parseFloat(doc.x),
    }, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" },
    });
  } catch {
    return NextResponse.json({ error: "Geocode fetch failed" }, { status: 500 });
  }
}
