import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await prisma.wantedRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({
    data: requests.map((r) => ({
      ...r,
      budgetMin: r.budgetMin?.toString() ?? null,
      budgetMax: r.budgetMax?.toString() ?? null,
      monthlyRentMax: r.monthlyRentMax?.toString() ?? null,
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate required fields
    const cities = body.cities as string[] | undefined;
    const categories = body.categories as string[] | undefined;

    if (!cities || cities.length === 0) {
      return Response.json(
        { error: "희망 지역을 1개 이상 선택해주세요." },
        { status: 400 }
      );
    }
    if (!categories || categories.length === 0) {
      return Response.json(
        { error: "희망 업종을 1개 이상 선택해주세요." },
        { status: 400 }
      );
    }

    // Check active limit (max 3)
    const activeCount = await prisma.wantedRequest.count({
      where: { userId: session.user.id, status: "ACTIVE" },
    });
    if (activeCount >= 3) {
      return Response.json(
        { error: "활성 의뢰는 최대 3건까지 등록할 수 있습니다." },
        { status: 429 }
      );
    }

    const request = await prisma.wantedRequest.create({
      data: {
        userId: session.user.id,
        cities,
        districts: (body.districts as string[]) ?? [],
        categories,
        budgetMin: body.budgetMin ? BigInt(parseInt(body.budgetMin)) : null,
        budgetMax: body.budgetMax ? BigInt(parseInt(body.budgetMax)) : null,
        monthlyRentMax: body.monthlyRentMax
          ? BigInt(parseInt(body.monthlyRentMax))
          : null,
        areaMin: body.areaMin ? parseFloat(body.areaMin) : null,
        areaMax: body.areaMax ? parseFloat(body.areaMax) : null,
        memo: body.memo ?? null,
      },
    });

    return Response.json(
      {
        data: {
          ...request,
          budgetMin: request.budgetMin?.toString() ?? null,
          budgetMax: request.budgetMax?.toString() ?? null,
          monthlyRentMax: request.monthlyRentMax?.toString() ?? null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/wanted-requests error:", error);
    return Response.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
