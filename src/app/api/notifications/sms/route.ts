import { NextRequest } from "next/server";

/**
 * SMS 알림 발송 API (stub)
 *
 * 실제 SMS 발송 연동 시 아래 중 하나를 구현:
 * - NHN Cloud SMS API
 * - AWS SNS
 * - Twilio
 *
 * 현재는 발송 요청을 기록만 하고 성공 응답을 반환합니다.
 */
export async function POST(req: NextRequest) {
  try {
    const { to, message } = await req.json();

    if (!to || !message) {
      return Response.json({ error: "to and message required" }, { status: 400 });
    }

    // TODO: 실제 SMS 서비스 연동 시 이 부분을 교체
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("[SMS stub]", { to, message: message.slice(0, 50) });
    }

    return Response.json({ success: true, stub: true });
  } catch {
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
