import { prisma } from "@/lib/prisma";
import { formatKRW, formatDateKR } from "@/lib/utils/format";

export const metadata = { title: "정산 관리" };

export default async function AdminSettlementsPage() {
  const settlements = await prisma.settlement.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const statusLabels: Record<string, string> = {
    PENDING: "대기",
    PROCESSING: "처리 중",
    COMPLETED: "완료",
    FAILED: "실패",
  };
  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-50 text-yellow-700",
    PROCESSING: "bg-blue-50 text-blue-700",
    COMPLETED: "bg-green-50 text-green-700",
    FAILED: "bg-red-50 text-red-700",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">정산 관리</h1>
      <p className="mt-1 text-sm text-gray-500">총 {settlements.length}건</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {settlements.length === 0 ? (
          <div className="py-12 text-center text-gray-400">정산 내역이 없습니다.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">정산 기간</th>
                <th className="px-4 py-3 font-medium text-right">총 매출</th>
                <th className="px-4 py-3 font-medium text-right">수수료</th>
                <th className="px-4 py-3 font-medium text-right">정산액</th>
                <th className="px-4 py-3 font-medium text-center">상태</th>
                <th className="px-4 py-3 font-medium text-right">생성일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {settlements.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-navy">
                    {formatDateKR(s.periodStart)} ~ {formatDateKR(s.periodEnd)}
                  </td>
                  <td className="px-4 py-4 text-right">{formatKRW(s.totalAmount)}</td>
                  <td className="px-4 py-4 text-right text-gray-500">{formatKRW(s.feeAmount)}</td>
                  <td className="px-4 py-4 text-right font-medium text-navy">{formatKRW(s.netAmount)}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[s.status] ?? "bg-gray-100"}`}>
                      {statusLabels[s.status] ?? s.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-gray-400">{formatDateKR(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
