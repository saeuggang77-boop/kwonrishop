/**
 * SMS 문자 알림 발송 유틸리티 (Solapi)
 *
 * 결제/만기 관련 알림만 SMS로 발송
 *
 * 필요 환경변수:
 * - SOLAPI_API_KEY
 * - SOLAPI_API_SECRET
 * - SOLAPI_SENDER_PHONE  (발신번호, 사전 등록 필수)
 *
 * Solapi 가입: https://solapi.com
 * API 문서: https://docs.solapi.com
 */

import crypto from "crypto";

interface SmsMessage {
  to: string;
  text: string;
}

/**
 * Solapi SMS 발송
 *
 * API 키가 설정되지 않은 경우 (개발 모드):
 * - 콘솔에 로그만 출력
 *
 * API 키가 설정된 경우 (프로덕션):
 * - Solapi REST API 호출
 * - 실제 SMS 발송
 */
async function sendSms(message: SmsMessage): Promise<boolean> {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const senderPhone = process.env.SOLAPI_SENDER_PHONE;

  // Development mode: log only
  if (!apiKey || !apiSecret || !senderPhone) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[SMS] DEV MODE - Would send to:", message.to.slice(0, 3) + "****");
    }
    return false;
  }

  // Production mode: Solapi API
  try {
    const date = new Date().toISOString();
    const salt = crypto.randomUUID();
    const signature = crypto
      .createHmac("sha256", apiSecret)
      .update(date + salt)
      .digest("hex");

    const response = await fetch("https://api.solapi.com/messages/v4/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
      },
      body: JSON.stringify({
        message: {
          to: message.to.replace(/-/g, ""),
          from: senderPhone.replace(/-/g, ""),
          text: message.text,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[SMS] Solapi API Error:", errorData);
      return false;
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[SMS] Sent to:", message.to.slice(0, 3) + "****");
    }
    return true;
  } catch (error) {
    console.error("[SMS] Failed:", error);
    return false;
  }
}

// ── 결제/만기 관련 SMS 알림만 유지 ──

/**
 * 매물 노출 기간 만료 임박 알림
 */
export async function notifyListingExpiring(
  recipientPhone: string,
  listingName: string,
  daysLeft: number
): Promise<boolean> {
  const msg = daysLeft === 0
    ? `[권리샵] "${listingName}" 매물이 만료되었습니다. 연장하려면 사이트를 방문하세요.`
    : `[권리샵] "${listingName}" 매물이 ${daysLeft}일 후 만료됩니다. 연장하려면 사이트를 방문하세요.`;
  return sendSms({ to: recipientPhone, text: msg });
}

/**
 * 유료 상품 결제 완료 알림
 */
export async function notifyPaymentSuccess(
  recipientPhone: string,
  productName: string,
  amount: number
): Promise<boolean> {
  return sendSms({
    to: recipientPhone,
    text: `[권리샵] ${productName} 결제가 완료되었습니다. (${amount.toLocaleString()}원)`,
  });
}

/**
 * 유료 상품 만료 임박 알림
 */
export async function notifyPaymentExpiring(
  recipientPhone: string,
  productName: string,
  daysLeft: number
): Promise<boolean> {
  const msg = daysLeft === 0
    ? `[권리샵] ${productName} 상품이 만료되었습니다. 연장하려면 사이트를 방문하세요.`
    : `[권리샵] ${productName} 상품이 ${daysLeft}일 후 만료됩니다. 연장하려면 사이트를 방문하세요.`;
  return sendSms({ to: recipientPhone, text: msg });
}
