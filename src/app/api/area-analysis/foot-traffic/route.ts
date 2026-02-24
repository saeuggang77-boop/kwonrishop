import { NextRequest, NextResponse } from "next/server";

interface TimeSlot {
  time: string;
  level: number;
  label: string;
}

interface FootTrafficResponse {
  source: "seoul_living" | "store_density";
  data: TimeSlot[];
  dailyEstimate: number;
  reliability: "high" | "medium" | "low";
}

// Helper to classify foot traffic level
function getTrafficLabel(count: number): string {
  if (count < 500) return "한산";
  if (count < 2000) return "보통";
  if (count < 5000) return "활발";
  return "매우 활발";
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const dong = searchParams.get("dong");
  const city = searchParams.get("city");

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat, lng 좌표가 필요합니다." }, { status: 400 });
  }

  const isSeoul = city?.includes("서울");

  // Try Seoul Living Population API for Seoul addresses
  if (isSeoul) {
    const seoulApiKey = process.env.SEOUL_OPENDATA_API_KEY;
    if (seoulApiKey) {
      try {
        // Try recent dates (yesterday to 5 days back)
        const today = new Date();
        for (let daysBack = 1; daysBack <= 5; daysBack++) {
          const targetDate = new Date(today);
          targetDate.setDate(targetDate.getDate() - daysBack);
          const dateStr = targetDate.toISOString().slice(0, 10).replace(/-/g, "");

          const url = `http://openapi.seoul.go.kr:8088/${seoulApiKey}/json/SPOP_LOCAL_RESD_JACHI/1/1000/${dateStr}`;
          const res = await fetch(url);

          if (res.ok) {
            const data = await res.json();

            // Check for API errors in response body
            if (data?.RESULT?.CODE) {
              console.warn(`[Seoul Living] ${dateStr}: ${data.RESULT.CODE} - ${data.RESULT.MESSAGE}`);
              continue;
            }

            let rows = data?.SPOP_LOCAL_RESD_JACHI?.row ?? [];

            // Filter by dong (neighborhood) if provided
            if (dong && rows.length > 0) {
              const dongKeyword = dong.replace(/동$/, ""); // Remove trailing "동"
              rows = rows.filter((row: any) => {
                const districtName = row.ADSTRD_CD_NM || "";
                return districtName.includes(dongKeyword);
              });
            }

            if (rows.length > 0) {
              const row = rows[0]; // Use first matching district

              // Extract hourly data (TMST_00 through TMST_23)
              const hourlyData: number[] = [];
              for (let h = 0; h < 24; h++) {
                const fieldName = `TMST_${h.toString().padStart(2, "0")}`;
                hourlyData.push(Number(row[fieldName] || 0));
              }

              // Aggregate into time slots
              const morning = hourlyData.slice(6, 12).reduce((a, b) => a + b, 0); // 6-12시
              const lunch = hourlyData.slice(12, 14).reduce((a, b) => a + b, 0); // 12-14시
              const afternoon = hourlyData.slice(14, 18).reduce((a, b) => a + b, 0); // 14-18시
              const evening = hourlyData.slice(18, 22).reduce((a, b) => a + b, 0); // 18-22시
              const night = [...hourlyData.slice(22, 24), ...hourlyData.slice(0, 6)].reduce((a, b) => a + b, 0); // 22-6시

              const total = hourlyData.reduce((a, b) => a + b, 0);
              const maxSlot = Math.max(morning, lunch, afternoon, evening, night);

              const timeSlots: TimeSlot[] = [
                {
                  time: "오전 (6-12시)",
                  level: Math.round((morning / maxSlot) * 100),
                  label: getTrafficLabel(morning)
                },
                {
                  time: "점심 (12-14시)",
                  level: Math.round((lunch / maxSlot) * 100),
                  label: getTrafficLabel(lunch)
                },
                {
                  time: "오후 (14-18시)",
                  level: Math.round((afternoon / maxSlot) * 100),
                  label: getTrafficLabel(afternoon)
                },
                {
                  time: "저녁 (18-22시)",
                  level: Math.round((evening / maxSlot) * 100),
                  label: getTrafficLabel(evening)
                },
                {
                  time: "야간 (22-6시)",
                  level: Math.round((night / maxSlot) * 100),
                  label: getTrafficLabel(night)
                },
              ];

              const result: FootTrafficResponse = {
                source: "seoul_living",
                data: timeSlots,
                dailyEstimate: total,
                reliability: "high",
              };

              return NextResponse.json(result, {
                headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800" },
              });
            }
          }
        }
      } catch (err) {
        console.warn("[Seoul Living API] Error:", err);
        // Fall through to store density method
      }
    }
  }

  // Fallback: Use data.go.kr store density API
  const dataGoKrKey = process.env.DATA_GO_KR_API_KEY;
  if (!dataGoKrKey) {
    return NextResponse.json({ error: "API 키 미설정" }, { status: 500 });
  }

  try {
    const url = new URL("https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInRadius");
    url.searchParams.set("serviceKey", dataGoKrKey);
    url.searchParams.set("radius", "500");
    url.searchParams.set("cx", lng);
    url.searchParams.set("cy", lat);
    url.searchParams.set("numOfRows", "1000");
    url.searchParams.set("type", "json");

    const res = await fetch(url.toString());
    if (!res.ok) {
      return NextResponse.json({ error: "상가정보 API 오류" }, { status: 502 });
    }

    const data = await res.json();
    const items = data?.body?.items ?? [];
    const totalStores = data?.body?.totalCount ?? items.length;

    // Count by category
    const categoryMap = new Map<string, number>();
    for (const item of items) {
      const cat = item.indsLclsNm || "기타";
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    }

    // Calculate density score based on category mix
    const foodCount = (categoryMap.get("음식") || 0);
    const retailCount = (categoryMap.get("소매") || 0);
    const serviceCount = (categoryMap.get("생활서비스") || 0);

    // Heuristic: commercial areas with more food/retail = higher traffic
    // Base visitors per store area: 150 daily
    const baseDaily = totalStores * 150;

    // Boost for food/retail heavy areas (up to 1.5x)
    const commercialRatio = (foodCount + retailCount) / Math.max(totalStores, 1);
    const boostFactor = 1 + (commercialRatio * 0.5);
    const estimatedDaily = Math.round(baseDaily * boostFactor);

    // Time distribution heuristic
    const morning = estimatedDaily * 0.15;
    const lunch = estimatedDaily * 0.25;
    const afternoon = estimatedDaily * 0.25;
    const evening = estimatedDaily * 0.25;
    const night = estimatedDaily * 0.10;

    const maxSlot = Math.max(morning, lunch, afternoon, evening, night);

    const timeSlots: TimeSlot[] = [
      {
        time: "오전 (6-12시)",
        level: Math.round((morning / maxSlot) * 100),
        label: getTrafficLabel(morning)
      },
      {
        time: "점심 (12-14시)",
        level: Math.round((lunch / maxSlot) * 100),
        label: getTrafficLabel(lunch)
      },
      {
        time: "오후 (14-18시)",
        level: Math.round((afternoon / maxSlot) * 100),
        label: getTrafficLabel(afternoon)
      },
      {
        time: "저녁 (18-22시)",
        level: Math.round((evening / maxSlot) * 100),
        label: getTrafficLabel(evening)
      },
      {
        time: "야간 (22-6시)",
        level: Math.round((night / maxSlot) * 100),
        label: getTrafficLabel(night)
      },
    ];

    const result: FootTrafficResponse = {
      source: "store_density",
      data: timeSlots,
      dailyEstimate: estimatedDaily,
      reliability: "medium",
    };

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800" },
    });
  } catch (err) {
    console.error("[Store Density API] Error:", err);
    return NextResponse.json({ error: "상가정보 API 호출 실패" }, { status: 500 });
  }
}
