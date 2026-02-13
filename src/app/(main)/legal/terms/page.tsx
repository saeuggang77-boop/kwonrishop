import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "이용약관" };

export default async function TermsPage() {
  const doc = await prisma.legalDocument.findUnique({
    where: { slug: "terms-of-service" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-heading text-3xl font-bold text-navy">
        {doc?.title ?? "이용약관"}
      </h1>
      {doc && (
        <p className="mt-2 text-sm text-gray-500">
          버전 {doc.version} | 시행일:{" "}
          {doc.effectiveDate.toLocaleDateString("ko-KR")}
        </p>
      )}
      <div className="mt-6 rounded-lg border border-warning/30 bg-warning/10 p-4">
        <p className="text-sm font-medium text-warning">
          본 약관은 법무 검토를 권장합니다. 중요한 법적 사항은 전문가와 상담하시기 바랍니다.
        </p>
      </div>
      <div className="prose prose-gray mt-8 max-w-none">
        {doc?.content ? (
          <div className="whitespace-pre-wrap">{doc.content}</div>
        ) : (
          <p>이용약관이 아직 등록되지 않았습니다.</p>
        )}
      </div>
      <div className="mt-8 border-t pt-6">
        <Link href="/legal/privacy" className="text-navy hover:text-navy-dark">
          개인정보처리방침 보기 &rarr;
        </Link>
      </div>
    </div>
  );
}
