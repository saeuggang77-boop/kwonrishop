import { NextRequest } from "next/server";
import { processSettlements } from "@/lib/settlement/processor";
import { verifyCronAuth } from "@/lib/cron-auth";

export async function POST(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const count = await processSettlements();
    return Response.json({
      data: { success: true, settlementsProcessed: count },
    });
  } catch (error) {
    console.error("Settlement CRON failed:", error);
    return Response.json({ error: "Settlement processing failed" }, { status: 500 });
  }
}
