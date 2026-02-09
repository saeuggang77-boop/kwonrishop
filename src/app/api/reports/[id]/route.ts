import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDownloadPresignedUrl } from "@/lib/s3/presigned";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report || report.userId !== session.user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Generate fresh download URL if report is completed
  let downloadUrl = report.downloadUrl;
  if (report.status === "COMPLETED" && report.s3Key) {
    downloadUrl = await getDownloadPresignedUrl(report.s3Key, "reports", 3600);

    // Update stored URL
    await prisma.report.update({
      where: { id },
      data: { downloadUrl },
    });
  }

  return Response.json({
    data: {
      id: report.id,
      status: report.status,
      downloadUrl,
      dataSources: report.dataSources,
      modelAssumptions: report.modelAssumptions,
      modelVersion: report.modelVersion,
      legalDisclaimer: report.legalDisclaimer,
      generatedAt: report.generatedAt,
      createdAt: report.createdAt,
    },
  });
}
