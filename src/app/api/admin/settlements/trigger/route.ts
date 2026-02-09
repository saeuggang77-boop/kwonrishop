import { auth } from "@/lib/auth";
import { settlementQueue } from "@/lib/queue";

export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const job = await settlementQueue.add("manual-trigger", {
    date: new Date().toISOString(),
  });

  return Response.json({
    data: { jobId: job.id, message: "Settlement processing triggered" },
  });
}
