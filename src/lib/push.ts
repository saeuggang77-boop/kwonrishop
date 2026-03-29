/**
 * 서버 측 푸시 알림 발송 유틸리티
 *
 * firebase-admin SDK를 사용하여 FCM 푸시를 발송합니다.
 * FIREBASE_SERVICE_ACCOUNT_JSON 환경변수가 없으면 콘솔 로그만 출력합니다.
 */

import { prisma } from "@/lib/prisma";

let adminInitialized = false;
let adminMessaging: ReturnType<typeof import("firebase-admin").messaging> | null = null;

/**
 * firebase-admin을 lazy 초기화합니다.
 * 서비스 계정이 없으면 null을 반환합니다.
 */
async function getAdminMessaging() {
  if (adminInitialized) return adminMessaging;
  adminInitialized = true;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[Push] FIREBASE_SERVICE_ACCOUNT_JSON not set - push disabled (dev mode)");
    }
    return null;
  }

  try {
    const admin = await import("firebase-admin");

    if (admin.apps.length === 0) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    adminMessaging = admin.messaging();
    return adminMessaging;
  } catch (error) {
    console.error("[Push] Failed to initialize firebase-admin:", error);
    return null;
  }
}

/**
 * 특정 사용자에게 푸시 알림을 발송합니다.
 *
 * @param userId - 대상 사용자 ID
 * @param title - 알림 제목
 * @param body - 알림 내용
 * @param link - 클릭 시 이동할 URL (상대 경로)
 */
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  link?: string
): Promise<boolean> {
  try {
    // DB에서 사용자의 FCM 토큰 조회
    const tokens = await prisma.pushToken.findMany({
      where: { userId },
      select: { token: true, id: true },
    });

    if (tokens.length === 0) {
      return false;
    }

    const fcm = await getAdminMessaging();

    if (!fcm) {
      // firebase-admin 미설정: 로그만 출력
      if (process.env.NODE_ENV !== "production") {
        console.log(`[Push] DEV MODE - Would send to user ${userId}: "${title}" - "${body}"`);
      }
      return false;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.kwonrishop.com";
    const fullLink = link ? `${appUrl}${link}` : appUrl;

    // 여러 토큰에 동시 발송
    const results = await Promise.allSettled(
      tokens.map(({ token }) =>
        fcm.send({
          token,
          notification: {
            title,
            body,
          },
          data: {
            title,
            body,
            link: link || "/",
            url: fullLink,
          },
          webpush: {
            fcmOptions: {
              link: fullLink,
            },
            notification: {
              icon: "/favicon.svg",
              badge: "/favicon.svg",
            },
          },
        })
      )
    );

    // 만료/무효 토큰 정리
    const tokensToDelete: string[] = [];
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        const error = result.reason;
        const errorCode = error?.code || error?.errorInfo?.code || "";
        if (
          errorCode === "messaging/registration-token-not-registered" ||
          errorCode === "messaging/invalid-registration-token"
        ) {
          tokensToDelete.push(tokens[index].id);
        }
      }
    });

    if (tokensToDelete.length > 0) {
      await prisma.pushToken.deleteMany({
        where: { id: { in: tokensToDelete } },
      });
    }

    const successCount = results.filter((r) => r.status === "fulfilled").length;
    return successCount > 0;
  } catch (error) {
    console.error("[Push] Failed to send:", error);
    return false;
  }
}

/**
 * 여러 사용자에게 동시에 푸시 알림을 발송합니다.
 */
export async function sendPushToUsers(
  userIds: string[],
  title: string,
  body: string,
  link?: string
): Promise<void> {
  await Promise.allSettled(
    userIds.map((userId) => sendPushToUser(userId, title, body, link))
  );
}
