import { processSettlements } from "@/lib/settlement/processor";

export async function POST() {
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
