"use client";

import { redirect } from "next/navigation";

// 구독 시스템 비활성화 — 광고 관리로 리디렉트
export default function PremiumManagePage() {
  redirect("/my/ads");
}
