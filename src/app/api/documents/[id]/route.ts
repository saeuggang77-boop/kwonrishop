import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDownloadPresignedUrl } from "@/lib/s3/presigned";
import { deleteFromS3 } from "@/lib/s3/upload";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc || doc.isDeleted) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Check access: owner or admin
  if (doc.uploaderId !== session.user.id && session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check expiration
  if (doc.expiresAt && doc.expiresAt < new Date()) {
    return Response.json({ error: "Document expired" }, { status: 410 });
  }

  // Generate presigned download URL
  const downloadUrl = await getDownloadPresignedUrl(doc.s3Key, "uploads", 3600);

  return Response.json({
    data: {
      id: doc.id,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      downloadUrl,
      expiresAt: doc.expiresAt,
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc || doc.isDeleted) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (doc.uploaderId !== session.user.id && session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteFromS3(doc.s3Key);
  await prisma.document.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });

  return Response.json({ data: { success: true } });
}
