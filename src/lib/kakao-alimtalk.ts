/**
 * 카카오 알림톡 발송 유틸리티
 *
 * 카카오 비즈메시지 API 연동 시 실제 발송으로 전환
 * 현재: 콘솔 로그 + DB 알림 저장
 *
 * 필요 환경변수:
 * - KAKAO_ALIMTALK_API_KEY
 * - KAKAO_ALIMTALK_SENDER_KEY
 * - KAKAO_ALIMTALK_CHANNEL_ID
 */

interface AlimtalkMessage {
  templateCode: string;
  recipientPhone: string;
  variables: Record<string, string>;
}

// Template codes for different notification types
export const ALIMTALK_TEMPLATES = {
  NEW_CHAT: "CHAT_001",           // 새 채팅 메시지 도착
  PRICE_CHANGE: "PRICE_001",      // 관심매물 가격 변동
  LISTING_EXPIRING: "EXPIRE_001", // 매물 노출 기간 만료 임박
  PAYMENT_SUCCESS: "PAY_001",     // 유료 상품 결제 완료
  PAYMENT_EXPIRING: "PAY_002",    // 유료 상품 만료 임박
  NEW_INQUIRY: "INQ_001",         // 새 문의 도착 (프랜차이즈)
} as const;

/**
 * 카카오 알림톡 발송
 *
 * API 키가 설정되지 않은 경우 (개발 모드):
 * - 콘솔에 로그만 출력
 * - 실제 발송하지 않음
 *
 * API 키가 설정된 경우 (프로덕션):
 * - 카카오 비즈메시지 API 호출
 * - 실제 알림톡 발송
 */
export async function sendAlimtalk(message: AlimtalkMessage): Promise<boolean> {
  const apiKey = process.env.KAKAO_ALIMTALK_API_KEY;
  const senderKey = process.env.KAKAO_ALIMTALK_SENDER_KEY;

  // Development mode: log only
  if (!apiKey || !senderKey) {
    console.log("[Alimtalk] DEV MODE - Would send:", {
      template: message.templateCode,
      recipient: message.recipientPhone,
      variables: message.variables,
    });
    return true;
  }

  // Production mode: call Kakao API
  try {
    // TODO: Replace with actual Kakao Biz Message API endpoint
    const response = await fetch("https://api.kakao.com/v2/api/talk/send", {
      method: "POST",
      headers: {
        Authorization: `KakaoAK ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender_key: senderKey,
        template_code: message.templateCode,
        receiver_no: message.recipientPhone,
        variables: message.variables,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[Alimtalk] API Error:", errorData);
      return false;
    }

    console.log("[Alimtalk] Sent:", {
      template: message.templateCode,
      recipient: message.recipientPhone,
    });
    return true;
  } catch (error) {
    console.error("[Alimtalk] Failed:", error);
    return false;
  }
}

/**
 * 새 채팅 메시지 알림
 *
 * @param recipientPhone - 수신자 전화번호 (010-1234-5678)
 * @param senderName - 발신자 이름
 * @param listingName - 매물 이름
 */
export async function notifyNewChat(
  recipientPhone: string,
  senderName: string,
  listingName: string
): Promise<boolean> {
  return sendAlimtalk({
    templateCode: ALIMTALK_TEMPLATES.NEW_CHAT,
    recipientPhone,
    variables: {
      sender_name: senderName,
      listing_name: listingName,
      link: "https://kwonrishop.com/chat",
    },
  });
}

/**
 * 관심매물 가격 변동 알림
 *
 * @param recipientPhone - 수신자 전화번호
 * @param listingName - 매물 이름
 * @param oldPrice - 이전 가격
 * @param newPrice - 변경된 가격
 */
export async function notifyPriceChange(
  recipientPhone: string,
  listingName: string,
  oldPrice: number,
  newPrice: number
): Promise<boolean> {
  const priceChange = newPrice - oldPrice;
  const changeDirection = priceChange > 0 ? "인상" : "인하";

  return sendAlimtalk({
    templateCode: ALIMTALK_TEMPLATES.PRICE_CHANGE,
    recipientPhone,
    variables: {
      listing_name: listingName,
      old_price: oldPrice.toLocaleString(),
      new_price: newPrice.toLocaleString(),
      change_direction: changeDirection,
      change_amount: Math.abs(priceChange).toLocaleString(),
      link: "https://kwonrishop.com/mypage/favorites",
    },
  });
}

/**
 * 매물 노출 기간 만료 임박 알림
 *
 * @param recipientPhone - 수신자 전화번호
 * @param listingName - 매물 이름
 * @param daysLeft - 남은 일수
 */
export async function notifyListingExpiring(
  recipientPhone: string,
  listingName: string,
  daysLeft: number
): Promise<boolean> {
  return sendAlimtalk({
    templateCode: ALIMTALK_TEMPLATES.LISTING_EXPIRING,
    recipientPhone,
    variables: {
      listing_name: listingName,
      days_left: daysLeft.toString(),
      link: "https://kwonrishop.com/mypage/listings",
    },
  });
}

/**
 * 유료 상품 결제 완료 알림
 *
 * @param recipientPhone - 수신자 전화번호
 * @param productName - 상품명
 * @param amount - 결제 금액
 */
export async function notifyPaymentSuccess(
  recipientPhone: string,
  productName: string,
  amount: number
): Promise<boolean> {
  return sendAlimtalk({
    templateCode: ALIMTALK_TEMPLATES.PAYMENT_SUCCESS,
    recipientPhone,
    variables: {
      product_name: productName,
      amount: amount.toLocaleString(),
      link: "https://kwonrishop.com/mypage",
    },
  });
}

/**
 * 유료 상품 만료 임박 알림
 *
 * @param recipientPhone - 수신자 전화번호
 * @param productName - 상품명
 * @param daysLeft - 남은 일수
 */
export async function notifyPaymentExpiring(
  recipientPhone: string,
  productName: string,
  daysLeft: number
): Promise<boolean> {
  return sendAlimtalk({
    templateCode: ALIMTALK_TEMPLATES.PAYMENT_EXPIRING,
    recipientPhone,
    variables: {
      product_name: productName,
      days_left: daysLeft.toString(),
      link: "https://kwonrishop.com/mypage/ads",
    },
  });
}

/**
 * 새 문의 도착 알림 (프랜차이즈 본사용)
 *
 * @param recipientPhone - 수신자 전화번호
 * @param inquiryType - 문의 유형
 * @param brandName - 브랜드명
 */
export async function notifyNewInquiry(
  recipientPhone: string,
  inquiryType: string,
  brandName: string
): Promise<boolean> {
  return sendAlimtalk({
    templateCode: ALIMTALK_TEMPLATES.NEW_INQUIRY,
    recipientPhone,
    variables: {
      inquiry_type: inquiryType,
      brand_name: brandName,
      link: "https://kwonrishop.com/franchise/inquiries",
    },
  });
}
