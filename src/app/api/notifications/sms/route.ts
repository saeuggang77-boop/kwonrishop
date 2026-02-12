import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { to, message } = await req.json();

    if (!to || !message) {
      return Response.json({ error: "to and message required" }, { status: 400 });
    }

    // 실제 SMS 발송은 추후 구현
    console.log("[SMS Notification]", { to, message, timestamp: new Date().toISOString() });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
