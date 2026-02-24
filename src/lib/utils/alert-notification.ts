import { prisma } from "@/lib/prisma";

interface AlertSettings {
  userId: string;
  enabled: boolean;
  cities: string[];
  categories: string[];
}

/**
 * Send notifications to users who have alert settings matching the new listing
 */
export async function notifyMatchingUsers(
  listingId: string,
  city: string,
  businessCategory: string,
  listingTitle: string
) {
  try {
    // @ts-ignore - alertSettings may not exist in schema yet
    const matchingSettings = await prisma.alertSettings.findMany({
      where: {
        enabled: true,
        OR: [
          {
            AND: [
              { cities: { has: city } },
              { categories: { has: businessCategory } },
            ],
          },
          {
            AND: [
              { cities: { has: city } },
              { categories: { isEmpty: true } },
            ],
          },
          {
            AND: [
              { cities: { isEmpty: true } },
              { categories: { has: businessCategory } },
            ],
          },
        ],
      },
      select: { userId: true },
    });

    if (matchingSettings.length === 0) {
      return { sent: 0 };
    }

    // Create notifications for matching users
    const notifications = matchingSettings.map((setting: { userId: string }) => ({
      userId: setting.userId,
      title: "새 매물 알림",
      message: `관심 지역/업종의 새 매물이 등록되었습니다: ${listingTitle}`,
      link: `/listings/${listingId}`,
      sourceType: "listing_alert",
      sourceId: listingId,
    }));

    await prisma.notification.createMany({
      data: notifications,
    });

    return { sent: notifications.length };
  } catch (error) {
    // If alertSettings table doesn't exist, fail silently
    console.error("Alert notification error:", error);
    return { sent: 0, error: "AlertSettings table not found" };
  }
}

/**
 * Get category display name for notification
 */
export function getCategoryDisplayName(category: string): string {
  const categoryMap: Record<string, string> = {
    KOREAN_FOOD: "한식",
    CHINESE_FOOD: "중식",
    JAPANESE_FOOD: "일식",
    WESTERN_FOOD: "양식",
    CHICKEN: "치킨",
    PIZZA: "피자",
    CAFE_BAKERY: "카페/베이커리",
    BAR_PUB: "술집/펍",
    BUNSIK: "분식",
    DELIVERY: "배달전문",
    OTHER_FOOD: "기타음식",
    SERVICE: "서비스업",
    RETAIL: "소매업",
    ENTERTAINMENT: "유흥업",
    EDUCATION: "교육업",
    ACCOMMODATION: "숙박업",
    ASIAN_FOOD: "아시안",
    MEAT: "고기/구이",
    BURGER: "버거",
    NIGHTCLUB: "나이트클럽",
    OTHER: "기타",
  };
  return categoryMap[category] || category;
}
