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
  return prisma.notification.create({
    data: {
      userId,
      title,
      message,
      link,
      sourceType,
      sourceId,
    },
  });
}
