/**
 * 끌어올리기 구독 시각 계산 유틸
 */

import type { BumpFrequency } from "@/generated/prisma/enums";

/**
 * 다음 끌어올리기 시각 계산
 * @param frequency 구독 주기
 * @param bumpTimes 실행 시각 배열 (예: ["09:00", "18:00"])
 * @returns 다음 실행 시각
 */
export function calculateNextBumpTime(
  frequency: BumpFrequency,
  bumpTimes: string[]
): Date {
  const now = new Date();
  const nowHour = now.getHours();
  const nowMinute = now.getMinutes();

  // bumpTimes 파싱 (HH:MM 형식)
  const times = bumpTimes.map((t) => {
    const [h, m] = t.split(":").map(Number);
    return { hour: h, minute: m };
  });

  switch (frequency) {
    case "TWICE_WEEKLY": {
      // 주 2회 (월요일=1, 목요일=4)
      const targetDays = [1, 4];
      const today = now.getDay();
      const targetTime = times[0];

      // 오늘이 월/목이고 아직 실행 시각 전이면 오늘
      if (
        targetDays.includes(today) &&
        (nowHour < targetTime.hour ||
          (nowHour === targetTime.hour && nowMinute < targetTime.minute))
      ) {
        const next = new Date(now);
        next.setHours(targetTime.hour, targetTime.minute, 0, 0);
        return next;
      }

      // 다음 월 또는 목 찾기
      let daysToAdd = 1;
      let nextDay = (today + 1) % 7;
      while (!targetDays.includes(nextDay) && daysToAdd < 7) {
        daysToAdd++;
        nextDay = (today + daysToAdd) % 7;
      }

      const next = new Date(now);
      next.setDate(next.getDate() + daysToAdd);
      next.setHours(targetTime.hour, targetTime.minute, 0, 0);
      return next;
    }

    case "WEEKDAY_DAILY": {
      // 평일 매일 (월~금)
      const targetTime = times[0];
      const today = now.getDay();

      // 오늘이 평일(1~5)이고 아직 실행 시각 전이면 오늘
      if (
        today >= 1 &&
        today <= 5 &&
        (nowHour < targetTime.hour ||
          (nowHour === targetTime.hour && nowMinute < targetTime.minute))
      ) {
        const next = new Date(now);
        next.setHours(targetTime.hour, targetTime.minute, 0, 0);
        return next;
      }

      // 다음 평일 찾기
      let daysToAdd = 1;
      let nextDay = (today + 1) % 7;
      while ((nextDay === 0 || nextDay === 6) && daysToAdd < 7) {
        daysToAdd++;
        nextDay = (today + daysToAdd) % 7;
      }

      const next = new Date(now);
      next.setDate(next.getDate() + daysToAdd);
      next.setHours(targetTime.hour, targetTime.minute, 0, 0);
      return next;
    }

    case "DAILY": {
      // 매일 1회
      const targetTime = times[0];

      // 오늘 실행 시각이 아직 안 지났으면 오늘
      if (
        nowHour < targetTime.hour ||
        (nowHour === targetTime.hour && nowMinute < targetTime.minute)
      ) {
        const next = new Date(now);
        next.setHours(targetTime.hour, targetTime.minute, 0, 0);
        return next;
      }

      // 내일
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      next.setHours(targetTime.hour, targetTime.minute, 0, 0);
      return next;
    }

    case "TWICE_DAILY": {
      // 매일 2회 (예: 09:00, 18:00)
      const sortedTimes = times.sort((a, b) => a.hour - b.hour);

      // 오늘 남은 시각 찾기
      for (const t of sortedTimes) {
        if (
          nowHour < t.hour ||
          (nowHour === t.hour && nowMinute < t.minute)
        ) {
          const next = new Date(now);
          next.setHours(t.hour, t.minute, 0, 0);
          return next;
        }
      }

      // 오늘 모든 시각 지났으면 내일 첫 시각
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      next.setHours(sortedTimes[0].hour, sortedTimes[0].minute, 0, 0);
      return next;
    }

    default:
      // fallback: 내일 09:00
      const fallback = new Date(now);
      fallback.setDate(fallback.getDate() + 1);
      fallback.setHours(9, 0, 0, 0);
      return fallback;
  }
}
