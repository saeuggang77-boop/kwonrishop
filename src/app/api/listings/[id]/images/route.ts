import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromS3 } from "@/lib/s3/upload";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const images = await prisma.listingImage.findMany({
    where: { listingId: id },
    orderBy: { sortOrder: "asc" },
  });

  return Response.json({ data: images });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { sellerId: true },
  });

  if (!listing || listing.sellerId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { imageId } = await req.json();
  if (!imageId) {
    return Response.json({ error: "imageId required" }, { status: 400 });
  }

  const image = await prisma.listingImage.findUnique({ where: { id: imageId } });
  if (!image || image.listingId !== listingId) {
    return Response.json({ error: "Image not found" }, { status: 404 });
  }

  // Delete from S3
  await deleteFromS3(image.s3Key);
  if (image.thumbnailUrl) {
    const thumbKey = image.s3Key.replace(/(\.\w+)$/, "_thumb.jpg");
    await deleteFromS3(thumbKey).catch(() => {});
  }

  // Delete from DB
  await prisma.listingImage.delete({ where: { id: imageId } });

  return Response.json({ data: { success: true } });
}
