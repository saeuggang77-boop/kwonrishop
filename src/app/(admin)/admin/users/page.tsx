import { prisma } from "@/lib/prisma";
import { formatDateKR } from "@/lib/utils/format";

export const metadata = { title: "회원 관리" };

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      accountStatus: true,
      createdAt: true,
    },
  });

  const roleLabels: Record<string, string> = { BUYER: "매수자", SELLER: "매도자", ADMIN: "관리자" };
  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-50 text-green-700",
    SUSPENDED: "bg-red-50 text-red-700",
    PENDING: "bg-yellow-50 text-yellow-700",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">회원 관리</h1>
      <p className="mt-1 text-sm text-gray-500">총 {users.length}명</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th className="px-6 py-3 font-medium">이름</th>
              <th className="px-4 py-3 font-medium">이메일</th>
              <th className="px-4 py-3 font-medium">유형</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium text-right">가입일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-navy">{user.name ?? "-"}</td>
                <td className="px-4 py-4 text-gray-600">{user.email}</td>
                <td className="px-4 py-4 text-gray-500">{roleLabels[user.role] ?? user.role}</td>
                <td className="px-4 py-4">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[user.accountStatus] ?? "bg-gray-100"}`}>
                    {user.accountStatus}
                  </span>
                </td>
                <td className="px-4 py-4 text-right text-gray-400">{formatDateKR(user.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
