import { NextRequest } from "next/server";

export function verifyCronAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // Allow in development
  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}
