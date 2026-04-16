import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
  const { Pool } = await import("pg");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { PrismaClient } = await import("../src/generated/prisma/client.js");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // 최근 3개 유령 게시글의 전체 스레드 (Comment + PendingComment 합쳐서)
  const posts = await prisma.post.findMany({
    where: { author: { isGhost: true } },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: { id: true, title: true },
  });

  for (const post of posts) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📝 ${post.title}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    const published = await prisma.comment.findMany({
      where: { postId: post.id },
      orderBy: { createdAt: "asc" },
      include: { author: { select: { name: true } } },
    });
    const pendings = await prisma.pendingComment.findMany({
      where: { postId: post.id },
      orderBy: { scheduledFor: "asc" },
    });

    if (published.length > 0) {
      console.log(`\n  [이미 발행된 댓글 ${published.length}개]`);
      for (const c of published) {
        console.log(`  💬 ${c.author.name}${c.parentId ? " (답글)" : ""}`);
        console.log(`     ${c.content.replace(/\n/g, "\n     ")}`);
      }
    }

    if (pendings.length > 0) {
      console.log(`\n  [발행 예약 ${pendings.length}개 (${pendings[0].status}~)]`);
      for (const p of pendings) {
        const icon = p.parentPendingId ? "↳" : "▸";
        console.log(`  ${icon} ${p.authorName} [${p.status}]`);
        console.log(`     ${p.content.replace(/\n/g, "\n     ")}`);
      }
    }
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
