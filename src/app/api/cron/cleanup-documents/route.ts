import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFromS3 } from "@/lib/s3/upload";
import { verifyCronAuth } from "@/lib/cron-auth";

export async function POST(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expiredDocs = await prisma.document.findMany({
      where: {
        expiresAt: { lte: new Date() },
        isDeleted: false,
      },
    });

    let deleted = 0;
    for (const doc of expiredDocs) {
      try {
        await deleteFromS3(doc.s3Key);
        await prisma.document.update({
          where: { id: doc.id },
          data: { isDeleted: true, deletedAt: new Date() },
        });
        deleted++;
      } catch (err) {
        console.error(`Failed to delete document ${doc.id}:`, err);
      }
    }

    return Response.json({
      data: { success: true, expiredFound: expiredDocs.length, deleted },
    });
  } catch (error) {
    console.error("Document cleanup CRON failed:", error);
    return Response.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
