import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");

  const where: Record<string, unknown> = { isPublished: true };
  if (category) where.category = category;

  const posts = await prisma.boardPost.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return Response.json({ data: posts });
}
