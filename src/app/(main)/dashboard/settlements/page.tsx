import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatKRW, formatDateKR } from "@/lib/utils/format";
import { DollarSign } from "lucide-react";

export const metadata = { title: "정산 내역" };

export default async function DashboardSettlementsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const payments = await prisma.payment.findMany({
    where: { userId: session.user.id, paymentStatus: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-navy">정산 내역</h1>

      {payments.length === 0 ? (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white py-12 text-center text-gray-400">
          <DollarSign className="mx-auto h-10 w-10" />
          <p className="mt-3">결제 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">결제일</th>
                <th className="px-4 py-3 font-medium">유형</th>
                <th className="px-4 py-3 font-medium text-right">금액</th>
                <th className="px-4 py-3 font-medium">결제 수단</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-600">{formatDateKR(p.createdAt)}</td>
                  <td className="px-4 py-4 text-gray-500">{p.paymentType}</td>
                  <td className="px-4 py-4 text-right font-medium text-navy">{formatKRW(p.amount)}</td>
                  <td className="px-4 py-4 text-gray-500">{p.method ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
