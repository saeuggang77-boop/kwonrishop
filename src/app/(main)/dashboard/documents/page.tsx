import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTimeKR } from "@/lib/utils/format";
import { DOCUMENT_TYPE_LABELS } from "@/lib/utils/constants";
import { FileText, Lock } from "lucide-react";

export const metadata = { title: "내 문서" };

export default async function DashboardDocumentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const documents = await prisma.document.findMany({
    where: { uploaderId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-navy">내 문서</h1>
      <p className="mt-1 text-sm text-gray-500">업로드한 문서 목록 (KMS 암호화 저장)</p>

      {documents.length === 0 ? (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white py-12 text-center text-gray-500">
          <FileText className="mx-auto h-10 w-10" />
          <p className="mt-3">업로드한 문서가 없습니다.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-mint" />
                <div>
                  <p className="font-medium text-navy">{doc.fileName}</p>
                  <p className="text-xs text-gray-500">
                    {DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentType} &middot; {formatDateTimeKR(doc.createdAt)}
                  </p>
                </div>
              </div>
              {doc.expiresAt && (
                <span className="text-xs text-gray-500">만료: {formatDateTimeKR(doc.expiresAt)}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
