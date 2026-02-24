import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const alertSettingsSchema = z.object({
  enabled: z.boolean(),
  cities: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Check if alertSettings table exists by trying to query it
    let settings = null;
    try {
      // @ts-ignore - alertSettings may not exist in schema yet
      settings = await prisma.alertSettings.findUnique({
        where: { userId: session.user.id },
      });
    } catch {
      // Table doesn't exist yet, return defaults
      settings = {
        enabled: false,
        cities: [],
        categories: [],
      };
    }

    return Response.json({
      data: settings || {
        enabled: false,
        cities: [],
        categories: [],
      },
    });
  } catch (error) {
    console.error("Alert settings fetch error:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = alertSettingsSchema.parse(body);

    try {
      // @ts-ignore - alertSettings may not exist in schema yet
      const settings = await prisma.alertSettings.upsert({
        where: { userId: session.user.id },
        update: {
          enabled: parsed.enabled,
          cities: parsed.cities || [],
          categories: parsed.categories || [],
        },
        create: {
          userId: session.user.id,
          enabled: parsed.enabled,
          cities: parsed.cities || [],
          categories: parsed.categories || [],
        },
      });

      return Response.json({ data: settings });
    } catch (error) {
      // If table doesn't exist, return error with migration hint
      return Response.json(
        {
          error: "알림 설정 기능을 사용하려면 데이터베이스 마이그레이션이 필요합니다.",
          hint: "prisma migrate dev를 실행하세요.",
        },
        { status: 503 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 });
    }
    console.error("Alert settings save error:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
