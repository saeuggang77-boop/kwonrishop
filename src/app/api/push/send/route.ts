import { NextRequest, NextResponse } from "next/server";
import { sendPushToUser } from "@/lib/push";
import { verifyBearerToken } from "@/lib/cron-auth";

/**
 * POST: 내부 호출용 푸시 발송 API
 * CRON_SECRET으로 인증하여 외부 노출을 방지합니다.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || !verifyBearerToken(authHeader, cronSecret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, title, body, link } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json(
        { error: "userId, title, body are required" },
        { status: 400 }
      );
    }

    const sent = await sendPushToUser(userId, title, body, link);

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    console.error("[Push Send API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
