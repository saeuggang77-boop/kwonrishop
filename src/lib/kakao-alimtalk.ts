/**
 * SMS 문자 알림 발송 유틸리티 (Solapi)
 *
 * Solapi API 연동 시 실제 발송으로 전환
 * 현재: 콘솔 로그만 출력 (개발 모드)
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

// ── 기존 함수 시그니처 유지 (호출부 변경 없음) ──

/**
 * 새 채팅 메시지 알림
 */
export async function notifyNewChat(
  recipientPhone: string,
  senderName: string,
  listingName: string
): Promise<boolean> {
  return sendSms({
    to: recipientPhone,
    text: `[권리샵] ${senderName}님이 "${listingName}" 매물에 메시지를 보냈습니다. 확인하세요.`,
  });
}

/**
 * 관심매물 가격 변동 알림
 */
export async function notifyPriceChange(
  recipientPhone: string,
  listingName: string,
  oldPrice: number,
  newPrice: number
): Promise<boolean> {
  const change = newPrice > oldPrice ? "인상" : "인하";
  return sendSms({
    to: recipientPhone,
    text: `[권리샵] 관심매물 "${listingName}" 가격이 ${change}되었습니다. ${oldPrice.toLocaleString()}만→${newPrice.toLocaleString()}만원`,
  });
}

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
  return sendSms({
    to: recipientPhone,
    text: `[권리샵] ${productName} 상품이 ${daysLeft}일 후 만료됩니다. 연장하려면 사이트를 방문하세요.`,
  });
}

/**
 * 새 문의 도착 알림 (프랜차이즈 본사용)
 */
export async function notifyNewInquiry(
  recipientPhone: string,
  inquiryType: string,
  brandName: string
): Promise<boolean> {
  return sendSms({
    to: recipientPhone,
    text: `[권리샵] ${brandName}에 새 ${inquiryType} 문의가 도착했습니다. 확인하세요.`,
  });
}

// 하위 호환용 export (기존 코드에서 참조하는 경우)
export const ALIMTALK_TEMPLATES = {
  NEW_CHAT: "SMS_CHAT",
  PRICE_CHANGE: "SMS_PRICE",
  LISTING_EXPIRING: "SMS_EXPIRE",
  PAYMENT_SUCCESS: "SMS_PAY",
  PAYMENT_EXPIRING: "SMS_PAY_EXPIRE",
  NEW_INQUIRY: "SMS_INQUIRY",
} as const;

export { sendSms as sendAlimtalk };
