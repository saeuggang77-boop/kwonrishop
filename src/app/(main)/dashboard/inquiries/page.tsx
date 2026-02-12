import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTimeKR } from "@/lib/utils/format";

export const metadata = { title: "문의 관리" };

export default async function InquiriesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Received inquiries
  const received = await prisma.inquiry.findMany({
    where: { receiverId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Sent inquiries
  const sent = await prisma.inquiry.findMany({
    where: { senderId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Fetch related data
  const allInquiries = [...received, ...sent];
  const listingIds = [...new Set(allInquiries.map((i) => i.listingId))];
  const userIds = [
    ...new Set([
      ...received.map((i) => i.senderId),
      ...sent.map((i) => i.receiverId),
    ]),
  ];

  const [listings, users] = await Promise.all([
    prisma.listing.findMany({
      where: { id: { in: listingIds } },
      select: { id: true, title: true },
    }),
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    }),
  ]);

  const listingMap = new Map(listings.map((l) => [l.id, l]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  const unreadReceived = received.filter((i) => !i.isRead).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-navy">문의 관리</h1>
      <p className="mt-1 text-sm text-gray-500">
        받은 문의 {received.length}건 {unreadReceived > 0 && `(${unreadReceived}건 미읽음)`} / 보낸 문의 {sent.length}건
      </p>

      {/* Received */}
      <h2 className="mt-8 text-lg font-bold text-navy">받은 문의</h2>
      {received.length === 0 ? (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white py-8 text-center text-gray-500">
          <MessageSquare className="mx-auto h-8 w-8" />
          <p className="mt-2">받은 문의가 없습니다.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {received.map((inq) => {
            const listing = listingMap.get(inq.listingId);
            const sender = userMap.get(inq.senderId);
            return (
              <div
                key={inq.id}
                className={`rounded-xl border bg-white p-5 ${
                  inq.isRead ? "border-gray-100" : "border-navy/30 bg-navy/5"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {!inq.isRead && (
                        <span className="h-2 w-2 rounded-full bg-navy" />
                      )}
                      <p className="font-medium text-navy">
                        {sender?.name ?? sender?.email ?? "익명"}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{inq.message}</p>
                    <div className="mt-2 flex gap-3 text-xs text-gray-500">
                      <span>매물: {listing?.title ?? inq.listingId}</span>
                      <span>{formatDateTimeKR(inq.createdAt)}</span>
                    </div>
                  </div>
                  {listing && (
                    <Link
                      href={`/listings/${inq.listingId}`}
                      className="shrink-0 text-sm text-navy hover:underline"
                    >
                      매물 보기
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sent */}
      <h2 className="mt-10 text-lg font-bold text-navy">보낸 문의</h2>
      {sent.length === 0 ? (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white py-8 text-center text-gray-500">
          <MessageSquare className="mx-auto h-8 w-8" />
          <p className="mt-2">보낸 문의가 없습니다.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {sent.map((inq) => {
            const listing = listingMap.get(inq.listingId);
            const receiver = userMap.get(inq.receiverId);
            return (
              <div
                key={inq.id}
                className="rounded-xl border border-gray-100 bg-white p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-navy">
                      To: {receiver?.name ?? receiver?.email ?? "판매자"}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">{inq.message}</p>
                    <div className="mt-2 flex gap-3 text-xs text-gray-500">
                      <span>매물: {listing?.title ?? inq.listingId}</span>
                      <span>{formatDateTimeKR(inq.createdAt)}</span>
                      <span>{inq.isRead ? "읽음" : "미확인"}</span>
                    </div>
                  </div>
                  {listing && (
                    <Link
                      href={`/listings/${inq.listingId}`}
                      className="shrink-0 text-sm text-navy hover:underline"
                    >
                      매물 보기
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
