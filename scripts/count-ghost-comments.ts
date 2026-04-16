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

  const ghostCommentCount = await prisma.comment.count({
    where: { author: { isGhost: true } },
  });
  const realCommentCount = await prisma.comment.count({
    where: { author: { isGhost: false } },
  });
  const pendingTotal = await prisma.pendingComment.count();
  const pendingPending = await prisma.pendingComment.count({
    where: { status: "PENDING" },
  });
  const pendingCompleted = await prisma.pendingComment.count({
    where: { status: "COMPLETED" },
  });
  const ghostPostCount = await prisma.post.count({
    where: { author: { isGhost: true } },
  });

  console.log("\n==========  현재 DB 상태 ==========");
  console.log(`  유령 게시글:          ${ghostPostCount}개`);
  console.log(`  ---`);
  console.log(`  Comment (유령 작성):  ${ghostCommentCount}개  ← 삭제 대상`);
  console.log(`  Comment (실사용자):   ${realCommentCount}개  ← 보존`);
  console.log(`  ---`);
  console.log(`  PendingComment 총계:  ${pendingTotal}개  ← 전부 유령`);
  console.log(`    · PENDING(대기):    ${pendingPending}개`);
  console.log(`    · COMPLETED(완료):  ${pendingCompleted}개`);
  console.log(`    · 기타:             ${pendingTotal - pendingPending - pendingCompleted}개`);
  console.log("====================================\n");

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
