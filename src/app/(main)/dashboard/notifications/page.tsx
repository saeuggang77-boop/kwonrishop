import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTimeKR } from "@/lib/utils/format";
import { MarkAllReadButton } from "./mark-all-read";

export const dynamic = "force-dynamic";
export const metadata = { title: "알림" };

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">알림</h1>
          <p className="mt-1 text-sm text-gray-500">
            {unreadCount > 0 ? `${unreadCount}개의 읽지 않은 알림` : "모든 알림을 확인했습니다"}
          </p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 ? (
        <div className="mt-12 rounded-xl border border-gray-200 bg-white py-16 text-center">
          <Bell className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-lg font-medium text-gray-500">알림이 없습니다</p>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border bg-white p-4 transition-colors ${
                n.isRead ? "border-gray-100" : "border-navy/30 bg-navy/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {!n.isRead && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-navy" />
                    )}
                    <p className="font-medium text-navy">{n.title}</p>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{n.message}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    {formatDateTimeKR(n.createdAt)}
                  </p>
                </div>
                {n.link && (
                  <Link
                    href={n.link}
                    className="shrink-0 text-sm text-navy hover:underline"
                  >
                    보기
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
