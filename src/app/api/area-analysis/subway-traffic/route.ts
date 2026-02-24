import { NextRequest, NextResponse } from "next/server";

interface HourlyData {
  hour: string;
  boarding: number;
  alighting: number;
}

interface SubwayTrafficResponse {
  station: string;
  lines: string[];
  monthlyData: {
    month: string;
    dailyAvgBoarding: number;
    dailyAvgAlighting: number;
    dailyAvgTotal: number;
    peakHour: string;
    peakCount: number;
  };
  hourlyBreakdown: HourlyData[];
}

// Helper to get days in month
function getDaysInMonth(yyyymm: string): number {
  const year = parseInt(yyyymm.slice(0, 4));
  const month = parseInt(yyyymm.slice(4, 6));
  return new Date(year, month, 0).getDate();
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const stationParam = searchParams.get("station");

  if (!stationParam) {
    return NextResponse.json({ error: "station 파라미터가 필요합니다." }, { status: 400 });
  }

  const apiKey = process.env.SEOUL_OPENDATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "SEOUL_OPENDATA_API_KEY 미설정" }, { status: 500 });
  }

  // Normalize station name (remove "역" suffix if present)
  const stationName = stationParam.replace(/역$/, "");

  // Try recent months (YYYYMM format)
  const today = new Date();
  const monthsToTry: string[] = [];
  for (let i = 0; i < 3; i++) {
    const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const yyyymm = `${targetDate.getFullYear()}${String(targetDate.getMonth() + 1).padStart(2, "0")}`;
    monthsToTry.push(yyyymm);
  }

  for (const month of monthsToTry) {
    try {
      const url = `http://openapi.seoul.go.kr:8088/${apiKey}/json/CardSubwayTime/1/1000/${month}`;
      const res = await fetch(url);

      if (!res.ok) continue;

      const data = await res.json();

      // Check for API errors
      if (data?.RESULT?.CODE) {
        console.warn(`[Subway Traffic] ${month}: ${data.RESULT.CODE}`);
        continue;
      }

      const rows = data?.CardSubwayTime?.row ?? [];
      if (rows.length === 0) continue;

      // Find rows matching station (try both with and without "역")
      const matchingRows = rows.filter((row: any) => {
        const sttnName = (row.STTN || "").replace(/역$/, "");
        return sttnName === stationName || sttnName === stationParam;
      });

      if (matchingRows.length === 0) continue;

      // Aggregate by line (multiple lines may serve same station)
      const lineData = new Map<string, any>();
      for (const row of matchingRows) {
        const lineName = row.SBWY_ROUT_LN_NM || "미상";
        if (!lineData.has(lineName)) {
          lineData.set(lineName, { ...row });
        } else {
          // Sum hourly data if duplicate lines exist
          const existing = lineData.get(lineName);
          for (let h = 4; h <= 27; h++) {
            const hourKey = h > 24 ? h - 24 : h;
            const getOnField = `HR_${h}_GET_ON_NOPE`;
            const getOffField = `HR_${h}_GET_OFF_NOPE`;
            existing[getOnField] = (Number(existing[getOnField]) || 0) + (Number(row[getOnField]) || 0);
            existing[getOffField] = (Number(existing[getOffField]) || 0) + (Number(row[getOffField]) || 0);
          }
          lineData.set(lineName, existing);
        }
      }

      // Aggregate all lines
      const lines = Array.from(lineData.keys());
      const hourlyBreakdown: HourlyData[] = [];
      let totalBoarding = 0;
      let totalAlighting = 0;
      let peakHour = "08시";
      let peakCount = 0;

      // Aggregate hourly data (HR_4 = 04시 through HR_3 = 03시)
      for (let h = 4; h <= 27; h++) {
        const hourKey = h > 24 ? h - 24 : h;
        const hourLabel = `${String(hourKey).padStart(2, "0")}시`;
        const getOnField = `HR_${h}_GET_ON_NOPE`;
        const getOffField = `HR_${h}_GET_OFF_NOPE`;

        let boarding = 0;
        let alighting = 0;

        for (const lineRow of lineData.values()) {
          boarding += Number(lineRow[getOnField]) || 0;
          alighting += Number(lineRow[getOffField]) || 0;
        }

        totalBoarding += boarding;
        totalAlighting += alighting;

        hourlyBreakdown.push({
          hour: hourLabel,
          boarding,
          alighting,
        });

        // Track peak hour
        const total = boarding + alighting;
        if (total > peakCount) {
          peakCount = total;
          peakHour = hourLabel;
        }
      }

      const daysInMonth = getDaysInMonth(month);
      const dailyAvgBoarding = Math.round(totalBoarding / daysInMonth);
      const dailyAvgAlighting = Math.round(totalAlighting / daysInMonth);
      const dailyAvgTotal = dailyAvgBoarding + dailyAvgAlighting;

      const response: SubwayTrafficResponse = {
        station: stationName,
        lines,
        monthlyData: {
          month,
          dailyAvgBoarding,
          dailyAvgAlighting,
          dailyAvgTotal,
          peakHour,
          peakCount: Math.round(peakCount / daysInMonth),
        },
        hourlyBreakdown,
      };

      return NextResponse.json(response, {
        headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200" },
      });
    } catch (err) {
      console.error(`[Subway Traffic] Error for ${month}:`, err);
      continue;
    }
  }

  // No data found for any month
  return NextResponse.json(
    { error: "해당 역의 승하차 데이터를 찾을 수 없습니다." },
    { status: 404 }
  );
}
