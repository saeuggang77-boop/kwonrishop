import { NextRequest } from "next/server";

export function verifyCronAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return false;
    }
    console.warn("[CRON] CRON_SECRET not set — accepting all requests in development");
    return true;
  }
  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}
