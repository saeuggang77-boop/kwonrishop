import { NextRequest, NextResponse } from "next/server";
import { getSeoulQuarters, type SeoulData } from "@/lib/utils/area-analysis";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const dong = searchParams.get("dong"); // neighborhood filter

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat, lng 좌표가 필요합니다." }, { status: 400 });
  }

  const apiKey = process.env.SEOUL_OPENDATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API 키 미설정" }, { status: 500 });
  }

  try {
    const quarters = getSeoulQuarters();
    let footTraffic: SeoulData["footTraffic"] = [];
    let estimatedSales: SeoulData["estimatedSales"] = [];
    let usedQuarter = "";

    // Try each quarter until we get data
    for (const quarter of quarters) {
      // Fetch larger dataset (1/1000 instead of 1/5) for filtering
      const footTrafficUrl = `http://openapi.seoul.go.kr:8088/${apiKey}/json/VwsmTrdarFlpop/1/1000/${quarter}`;
      const salesUrl = `http://openapi.seoul.go.kr:8088/${apiKey}/json/VwsmTrdarSelng/1/1000/${quarter}`;

      const [footTrafficRes, salesRes] = await Promise.all([
        fetch(footTrafficUrl).catch(() => null),
        fetch(salesUrl).catch(() => null),
      ]);

      // Parse foot traffic
      if (footTrafficRes?.ok) {
        const ftData = await footTrafficRes.json();
        let rows = ftData?.VwsmTrdarFlpop?.row ?? [];

        // Filter by dong (neighborhood) if provided
        if (dong && rows.length > 0) {
          const dongKeyword = dong.replace(/동$/, ""); // Remove trailing "동"
          rows = rows.filter((row: any) => {
            const districtName = row.TRDAR_CD_NM || "";
            return districtName.includes(dongKeyword);
          });
        }

        if (rows.length > 0) {
          const row = rows[0]; // Use first matching district
          footTraffic = [
            { dayOfWeek: "월", count: Number(row.MON_FLPOP_CO || 0) },
            { dayOfWeek: "화", count: Number(row.TUES_FLPOP_CO || 0) },
            { dayOfWeek: "수", count: Number(row.WED_FLPOP_CO || 0) },
            { dayOfWeek: "목", count: Number(row.THUR_FLPOP_CO || 0) },
            { dayOfWeek: "금", count: Number(row.FRI_FLPOP_CO || 0) },
            { dayOfWeek: "토", count: Number(row.SAT_FLPOP_CO || 0) },
            { dayOfWeek: "일", count: Number(row.SUN_FLPOP_CO || 0) },
          ];
        }
      }

      // Parse estimated sales
      if (salesRes?.ok) {
        const sData = await salesRes.json();
        let rows = sData?.VwsmTrdarSelng?.row ?? [];

        // Filter by dong if provided
        if (dong && rows.length > 0) {
          const dongKeyword = dong.replace(/동$/, "");
          rows = rows.filter((row: any) => {
            const districtName = row.TRDAR_CD_NM || "";
            return districtName.includes(dongKeyword);
          });
        }

        // Group by service industry category
        const salesMap = new Map<string, number>();
        for (const row of rows) {
          const cat = row.SVC_INDUTY_CD_NM || "기타";
          const amount = Number(row.THSMON_SELNG_AMT || 0);
          salesMap.set(cat, (salesMap.get(cat) || 0) + amount);
        }
        estimatedSales = Array.from(salesMap.entries())
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 8);
      }

      // If we got data, use this quarter and stop
      if (footTraffic.length > 0 || estimatedSales.length > 0) {
        usedQuarter = quarter;
        break;
      }
    }

    const result: SeoulData = {
      footTraffic,
      estimatedSales,
      quarterLabel: usedQuarter
        ? `${usedQuarter.slice(0, 4)}년 ${usedQuarter.slice(4)}분기`
        : "데이터 없음",
    };

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" },
    });
  } catch {
    return NextResponse.json({ error: "서울 데이터 조회 실패" }, { status: 500 });
  }
}
