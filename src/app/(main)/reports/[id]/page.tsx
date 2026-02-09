import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Download, ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTimeKR } from "@/lib/utils/format";

export const metadata = { title: "리포트 상세" };

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report || report.userId !== session.user.id) notFound();

  const statusLabels: Record<string, string> = { QUEUED: "대기", PROCESSING: "생성 중", COMPLETED: "완료", FAILED: "실패" };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/dashboard/reports" className="flex items-center gap-1 text-sm text-gray-500 hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> 리포트 목록
      </Link>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-bold text-navy">심층 리포트</h1>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-500">상태</p>
            <p className="mt-1 font-medium">{statusLabels[report.status] ?? report.status}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">생성일</p>
            <p className="mt-1 font-medium">{formatDateTimeKR(report.createdAt)}</p>
          </div>
        </div>

        {report.status === "COMPLETED" && report.downloadUrl && (
          <a
            href={report.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-mint px-6 py-3 text-sm font-medium text-white hover:bg-mint-dark"
          >
            <Download className="h-4 w-4" /> PDF 다운로드
          </a>
        )}

        {(report.status === "QUEUED" || report.status === "PROCESSING") && (
          <div className="mt-6 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-700">
            리포트를 생성 중입니다. 완료되면 이메일로 알려드립니다.
          </div>
        )}
      </div>
    </div>
  );
}
