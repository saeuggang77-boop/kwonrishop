import { prisma } from "@/lib/prisma";

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  link?: string;
  sourceType?: string;
  sourceId?: string;
}

export async function createNotification({
  userId,
  title,
  message,
  link,
  sourceType,
  sourceId,
}: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        link,
        sourceType,
        sourceId,
      },
    });
  } catch (error) {
    console.error("[notifications] Failed to create notification:", error);
    return null;
  }
}
