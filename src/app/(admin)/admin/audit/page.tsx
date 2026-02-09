import { prisma } from "@/lib/prisma";
import { formatDateTimeKR } from "@/lib/utils/format";

export const metadata = { title: "감사 로그" };

export default async function AdminAuditPage() {
  const logs = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const admins = logs.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: [...new Set(logs.map((l) => l.adminId))] } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const adminMap = new Map(admins.map((a) => [a.id, a]));

  const actionLabels: Record<string, string> = {
    APPROVE: "정상 처리",
    REJECT: "위반 확인",
    REQUEST_MORE_INFO: "추가 자료 요청",
    SUSPEND_USER: "계정 정지",
    ACTIVATE_USER: "계정 활성화",
    HIDE_LISTING: "매물 숨김",
    RESTORE_LISTING: "매물 복원",
  };

  const actionColors: Record<string, string> = {
    APPROVE: "text-green-600",
    REJECT: "text-red-600",
    REQUEST_MORE_INFO: "text-blue-600",
    SUSPEND_USER: "text-red-600",
    HIDE_LISTING: "text-orange-600",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">감사 로그</h1>
      <p className="mt-1 text-sm text-gray-500">관리자 액션 기록</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {logs.length === 0 ? (
          <div className="py-12 text-center text-gray-400">감사 로그가 없습니다.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">일시</th>
                <th className="px-4 py-3 font-medium">관리자</th>
                <th className="px-4 py-3 font-medium">액션</th>
                <th className="px-4 py-3 font-medium">대상</th>
                <th className="px-4 py-3 font-medium">메모</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => {
                const admin = adminMap.get(log.adminId);
                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                      {formatDateTimeKR(log.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-gray-600">{admin?.name ?? admin?.email ?? log.adminId}</td>
                    <td className={`px-4 py-4 font-medium ${actionColors[log.action] ?? "text-gray-700"}`}>
                      {actionLabels[log.action] ?? log.action}
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-400">{log.targetId ?? "-"}</td>
                    <td className="max-w-xs truncate px-4 py-4 text-gray-500">{log.reason ?? "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
