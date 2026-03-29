"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "@/lib/toast";

/**
 * FCM 웹 푸시 알림 관리 컴포넌트
 *
 * 로그인한 사용자에게 알림 권한을 요청하고,
 * FCM 토큰을 발급받아 서버에 등록합니다.
 * 포그라운드 메시지 수신 시 toast로 표시합니다.
 *
 * RootLayout이나 Header에 삽입합니다.
 */
export default function PushNotificationManager() {
  const { data: session, status } = useSession();
  const initialized = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;
    if (initialized.current) return;
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (!("serviceWorker" in navigator)) return;

    // Firebase 환경변수가 설정되어 있는지 체크
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return;

    initialized.current = true;

    async function setupPush() {
      try {
        // 이미 허용된 경우 바로 토큰 등록
        if (Notification.permission === "granted") {
          await registerToken();
          await setupForegroundListener();
          return;
        }

        // 거부된 경우 더 이상 요청하지 않음
        if (Notification.permission === "denied") {
          return;
        }

        // 최초 방문이 아닌 경우에만 자동으로 권한 요청
        // (첫 방문 시에는 마이페이지에서 수동으로 활성화하도록 유도)
        const hasAskedBefore = localStorage.getItem("push-permission-asked");
        if (!hasAskedBefore) {
          return;
        }

        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          await registerToken();
          await setupForegroundListener();
        }
      } catch (error) {
        console.error("[PushManager] Setup failed:", error);
      }
    }

    setupPush();
  }, [status, session?.user?.id]);

  return null;
}

/**
 * FCM 토큰을 발급받아 서버에 등록합니다.
 */
async function registerToken() {
  try {
    const { requestFCMToken } = await import("@/lib/firebase");
    const token = await requestFCMToken();

    if (!token) return;

    // 서버에 토큰 등록
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, device: "web" }),
    });
  } catch (error) {
    console.error("[PushManager] Token registration failed:", error);
  }
}

/**
 * 포그라운드 메시지 수신 리스너를 등록합니다.
 */
async function setupForegroundListener() {
  try {
    const { onForegroundMessage } = await import("@/lib/firebase");
    await onForegroundMessage((payload) => {
      if (payload.title) {
        toast.info(`${payload.title}: ${payload.body || ""}`);
      }
    });
  } catch (error) {
    console.error("[PushManager] Foreground listener failed:", error);
  }
}

/**
 * 외부에서 호출하여 푸시 알림을 활성화합니다.
 * 마이페이지 알림 설정에서 사용합니다.
 */
export async function enablePushNotification(): Promise<"granted" | "denied" | "unsupported"> {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window)) return "unsupported";
  if (!("serviceWorker" in navigator)) return "unsupported";

  try {
    localStorage.setItem("push-permission-asked", "true");

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      await registerToken();
      await setupForegroundListener();
      return "granted";
    }

    return "denied";
  } catch {
    return "unsupported";
  }
}

/**
 * 푸시 알림을 비활성화합니다.
 */
export async function disablePushNotification(): Promise<boolean> {
  try {
    const { requestFCMToken } = await import("@/lib/firebase");
    const token = await requestFCMToken();

    if (token) {
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
    }

    localStorage.removeItem("push-permission-asked");
    return true;
  } catch {
    return false;
  }
}
