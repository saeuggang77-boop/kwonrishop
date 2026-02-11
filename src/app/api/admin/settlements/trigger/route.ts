import { auth } from "@/lib/auth";
import { settlementQueue } from "@/lib/queue";

export async function POST() {
  try {
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
  } catch (error) {
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
