import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getMarketTrends } from "@/lib/insights/trends";
import { errorToResponse } from "@/lib/utils/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: { message: "인증이 필요합니다." } }, { status: 401 });
    }

    const city = req.nextUrl.searchParams.get("city");
    const district = req.nextUrl.searchParams.get("district");
    const days = Math.min(parseInt(req.nextUrl.searchParams.get("days") ?? "30"), 365);

    if (!city || !district) {
      return Response.json({ error: { message: "시/도와 구/군을 입력해주세요." } }, { status: 400 });
    }

    const result = await getMarketTrends({ city, district, days });
    return Response.json({ data: result });
  } catch (error) {
    return errorToResponse(error);
  }
}
