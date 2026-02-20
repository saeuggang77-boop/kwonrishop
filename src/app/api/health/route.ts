import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, "ok" | "error"> = {};

  // Database + Redis checks in parallel with timeouts
  const [dbResult, redisResult] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    Promise.race([
      getRedis().ping(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Redis timeout")), 2000),
      ),
    ]),
  ]);

  checks.database = dbResult.status === "fulfilled" ? "ok" : "error";
  checks.redis = redisResult.status === "fulfilled" ? "ok" : "error";

  const allOk = Object.values(checks).every((v) => v === "ok");

  return Response.json(
    {
      status: allOk ? "healthy" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 },
  );
}
