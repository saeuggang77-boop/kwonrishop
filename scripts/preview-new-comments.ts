/**
 * V2 댓글 생성 아키텍처 샘플 프리뷰
 *
 * 사용법:
 *   npx tsx scripts/preview-new-comments.ts
 *
 * - DB에서 실제 유령 게시글을 몇 개 읽어와서
 * - 신규 아키텍처로 스레드 생성 (PendingComment 저장 안 함)
 * - 콘솔에 출력
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config(); // fallback .env

async function main() {
  // 동적 import — dotenv가 먼저 실행되어야 @/lib/prisma의 createPrismaClient가
  // 올바른 DATABASE_URL을 읽음
  const { Pool } = await import("pg");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { PrismaClient } = await import("../src/generated/prisma/client.js");
  const { buildConversationThreadPlan } = await import("../src/lib/auto-content/scheduler");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const SAMPLE_COUNT = 3;

  console.log(`\n========= V2 댓글 생성 샘플 ${SAMPLE_COUNT}개 =========\n`);

  const posts = await prisma.post.findMany({
    where: { author: { isGhost: true } },
    orderBy: { createdAt: "desc" },
    take: SAMPLE_COUNT,
    include: {
      author: { select: { id: true, name: true, ghostPersonality: true } },
    },
  });

  if (posts.length === 0) {
    console.log("유령 게시글이 없습니다. 먼저 게시글을 시드하거나 자동 생성하세요.");
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📝 [게시글 ${i + 1}/${posts.length}]`);
    console.log(`   작성자: ${post.author.name} (${post.author.ghostPersonality})`);
    console.log(`   제목: ${post.title}`);
    console.log(`   내용: ${post.content.slice(0, 200).replace(/\n/g, " ")}${post.content.length > 200 ? "..." : ""}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    const threadSize = 4 + Math.floor(Math.random() * 3); // 4~6
    const authorReplyRate = 50;

    console.time(`  ⏱  스레드 ${i + 1} 생성`);
    try {
      const plan = await buildConversationThreadPlan({
        post: { id: post.id, title: post.title, content: post.content, authorId: post.authorId },
        threadSize,
        authorReplyRate,
      });
      console.timeEnd(`  ⏱  스레드 ${i + 1} 생성`);

      console.log(`\n  💬 생성된 댓글 ${plan.length}개:\n`);
      plan.forEach((msg) => {
        const prefix = msg.replyToIndex !== null ? `  ↳ [답글→#${msg.replyToIndex}]` : `  ▸ [댓글]`;
        const role = msg.isAuthor ? "👤 글쓴이" : "💬 댓글러";
        console.log(`${prefix} ${role} ${msg.commenterName}`);
        console.log(`    ${msg.content.replace(/\n/g, "\n    ")}`);
        console.log();
      });
    } catch (err) {
      console.timeEnd(`  ⏱  스레드 ${i + 1} 생성`);
      console.error(`  ❌ 생성 실패:`, err);
    }
  }

  console.log(`\n========= 완료 =========\n`);
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
