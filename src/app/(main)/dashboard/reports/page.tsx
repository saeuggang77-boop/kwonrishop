import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateKR } from "@/lib/utils/format";
import { FileText, Download } from "lucide-react";

export const metadata = { title: "내 권리진단서" };

export default async function DashboardReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const reports = await prisma.report.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const statusLabels: Record<string, string> = { QUEUED: "대기", PROCESSING: "생성 중", COMPLETED: "완료", FAILED: "실패" };
  const statusColors: Record<string, string> = {
    QUEUED: "bg-gray-50 text-gray-700", PROCESSING: "bg-yellow-50 text-yellow-700", COMPLETED: "bg-green-50 text-green-700", FAILED: "bg-red-50 text-red-700",
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-navy">내 권리진단서</h1>

      {reports.length === 0 ? (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white py-12 text-center text-gray-500">
          <FileText className="mx-auto h-10 w-10" />
          <p className="mt-3">발급받은 권리진단서가 없습니다.</p>
          <Link href="/listings" className="mt-2 inline-block text-sm text-navy hover:underline">매물에서 권리진단서 발급받기</Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5">
              <div>
                <p className="font-medium text-navy">권리진단서</p>
                <p className="text-xs text-gray-500">{formatDateKR(r.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[r.status] ?? "bg-gray-100"}`}>
                  {statusLabels[r.status] ?? r.status}
                </span>
                {r.status === "COMPLETED" && r.downloadUrl && (
                  <a href={r.downloadUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-navy hover:underline">
                    <Download className="h-4 w-4" /> PDF
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
