import { getRedis } from "@/lib/redis/client";

/**
 * 균등 순환 노출: items를 slotCount 크기 그룹으로 나누고,
 * Redis 원자 카운터로 방문자마다 다음 그룹을 반환합니다.
 *
 * - items <= slotCount: 전체 반환 (부족분은 fillItems로 채움)
 * - items > slotCount: ceil(items/slotCount) 그룹으로 나눠 순환
 * - Redis 장애 시 그룹 0 fallback
 */
export async function getRotatedGroup<T extends { id: string }>(
  items: T[],
  slotCount: number,
  redisKey: string,
  fillItems: T[] = [],
): Promise<T[]> {
  if (items.length === 0) {
    return fillItems.slice(0, slotCount);
  }

  if (items.length <= slotCount) {
    if (items.length < slotCount) {
      const usedIds = new Set(items.map((item) => item.id));
      const padding = fillItems
        .filter((item) => !usedIds.has(item.id))
        .slice(0, slotCount - items.length);
      return [...items, ...padding];
    }
    return items;
  }

  // 그룹 수 계산
  const totalGroups = Math.ceil(items.length / slotCount);

  // Redis INCR로 원자적 카운터 증가 (2초 타임아웃)
  let groupIndex = 0;
  try {
    const redis = getRedis();
    const counter = await Promise.race([
      redis.incr(redisKey),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Redis timeout")), 2000),
      ),
    ]);
    // 첫 생성 시 24시간 TTL (매일 리셋하여 순환 공정성 보장)
    if (counter === 1) {
      redis.expire(redisKey, 86400).catch(() => {});
    }
    groupIndex = (counter - 1) % totalGroups;
  } catch {
    // Redis 장애·타임아웃 시 그룹 0 fallback
    groupIndex = 0;
  }

  // 순차 슬라이싱
  const start = groupIndex * slotCount;
  const group = items.slice(start, start + slotCount);

  // 마지막 그룹이 짧으면 fillItems로 패딩
  if (group.length < slotCount) {
    const usedIds = new Set(group.map((item) => item.id));
    const padding = fillItems
      .filter((item) => !usedIds.has(item.id))
      .slice(0, slotCount - group.length);
    return [...group, ...padding];
  }

  return group;
}
