import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorToResponse } from "@/lib/utils/errors";

// GET - list user's simulations
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: { message: "로그인이 필요합니다." } }, { status: 401 });
    }

    const simulations = await prisma.simulation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        input: true,
        result: true,
        listingId: true,
        createdAt: true,
      },
    });

    return Response.json({ data: simulations });
  } catch (error) {
    return errorToResponse(error);
  }
}

// POST - save a simulation
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: { message: "로그인이 필요합니다." } }, { status: 401 });
    }

    const body = await req.json();
    const { title, input, result, listingId } = body;

    if (!title || !input || !result) {
      return Response.json({ error: { message: "필수 필드가 누락되었습니다." } }, { status: 400 });
    }

    const simulation = await prisma.simulation.create({
      data: {
        userId: session.user.id,
        title,
        input,
        result,
        listingId: listingId || null,
      },
    });

    return Response.json({ data: simulation }, { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}
