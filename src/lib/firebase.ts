/**
 * Firebase 클라이언트 SDK 초기화 (웹 푸시 알림용)
 *
 * 클라이언트 사이드에서만 사용:
 * - FCM 토큰 발급
 * - 포그라운드 메시지 수신
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  type Messaging,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
}

/**
 * Firebase Messaging 인스턴스를 반환합니다.
 * 브라우저 지원 여부를 먼저 체크합니다.
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;

  const supported = await isSupported();
  if (!supported) {
    console.warn("[FCM] This browser does not support Firebase Messaging");
    return null;
  }

  if (!messaging) {
    const fbApp = getFirebaseApp();
    messaging = getMessaging(fbApp);
  }
  return messaging;
}

/**
 * FCM 토큰을 발급받습니다.
 * 알림 권한이 허용된 상태에서만 동작합니다.
 */
export async function requestFCMToken(): Promise<string | null> {
  try {
    const msg = await getFirebaseMessaging();
    if (!msg) return null;

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn("[FCM] VAPID key not configured");
      return null;
    }

    // Service Worker 등록
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );

    const token = await getToken(msg, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      return token;
    }

    console.warn("[FCM] No token received");
    return null;
  } catch (error) {
    console.error("[FCM] Failed to get token:", error);
    return null;
  }
}

/**
 * 포그라운드 메시지 수신 리스너를 등록합니다.
 */
export async function onForegroundMessage(
  callback: (payload: { title?: string; body?: string; link?: string }) => void
): Promise<(() => void) | null> {
  const msg = await getFirebaseMessaging();
  if (!msg) return null;

  const unsubscribe = onMessage(msg, (payload) => {
    callback({
      title: payload.notification?.title || payload.data?.title,
      body: payload.notification?.body || payload.data?.body,
      link: payload.data?.link,
    });
  });

  return unsubscribe;
}
