/**
 * 유령 댓글 전체 재생성 (Option B)
 *
 * 1. 안전 체크: 실사용자 Comment가 0건인지 확인
 * 2. PendingComment 전체 삭제
 * 3. Comment (author.isGhost=true) 삭제
 * 4. 유령 게시글별로 V2 아키텍처로 스레드 재생성 (PendingComment 저장)
 * 5. 결과 리포트
 *
 * 사용법:
 *   npx tsx scripts/rebuild-ghost-comments.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
  const { Pool } = await import("pg");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { PrismaClient } = await import("../src/generated/prisma/client.js");
  const { generateConversationThread } = await import("../src/lib/auto-content/scheduler");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("\n==========  1. 안전 체크  ==========");
  const realUserCommentCount = await prisma.comment.count({
    where: { author: { isGhost: false } },
  });
  if (realUserCommentCount > 0) {
    console.error(`❌ 중단: 실사용자 댓글이 ${realUserCommentCount}건 존재. 삭제 불가.`);
    console.error("   수동 검토 필요. 실사용자 댓글을 보존하려면 별도 쿼리 필요.");
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  }
  console.log(`  ✅ 실사용자 Comment: 0건 (안전)`);

  const beforeComment = await prisma.comment.count({ where: { author: { isGhost: true } } });
  const beforePending = await prisma.pendingComment.count();
  console.log(`  📊 삭제 예정: Comment ${beforeComment}건 + PendingComment ${beforePending}건`);

  console.log("\n==========  2. 삭제 실행  ==========");
  const delPending = await prisma.pendingComment.deleteMany({});
  console.log(`  🗑  PendingComment 삭제: ${delPending.count}건`);

  // Comment는 answer/parent 관계가 있어서 하위부터 삭제해야 할 수도 있음
  // 우선 답글(parentId != null)부터, 그 다음 상위 댓글
  const delReplies = await prisma.comment.deleteMany({
    where: { author: { isGhost: true }, parentId: { not: null } },
  });
  console.log(`  🗑  Comment (답글) 삭제: ${delReplies.count}건`);
  const delTopLevel = await prisma.comment.deleteMany({
    where: { author: { isGhost: true }, parentId: null },
  });
  console.log(`  🗑  Comment (최상위) 삭제: ${delTopLevel.count}건`);

  const afterComment = await prisma.comment.count();
  const afterPending = await prisma.pendingComment.count();
  console.log(`  ✅ 삭제 후: Comment ${afterComment}건 (실사용자만), PendingComment ${afterPending}건`);

  console.log("\n==========  3. V2 아키텍처로 재생성  ==========");
  const posts = await prisma.post.findMany({
    where: { author: { isGhost: true } },
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, content: true, authorId: true, createdAt: true },
  });
  console.log(`  🎯 대상 게시글: ${posts.length}개\n`);

  let totalComments = 0;
  let totalReplies = 0;
  let failCount = 0;

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const threadSize = 4 + Math.floor(Math.random() * 3); // 4~6
    const authorReplyRate = 40 + Math.floor(Math.random() * 30); // 40~70%

    const prefix = `  [${String(i + 1).padStart(2, "0")}/${posts.length}]`;
    process.stdout.write(`${prefix} "${post.title.slice(0, 30)}..." ... `);
    const start = Date.now();

    try {
      const result = await generateConversationThread(
        {
          id: post.id,
          title: post.title,
          content: post.content,
          authorId: post.authorId,
          createdAt: post.createdAt,
        },
        threadSize,
        authorReplyRate
      );
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`✅ 댓글 ${result.commentCount} + 답글 ${result.replyCount} (${elapsed}s)`);
      totalComments += result.commentCount;
      totalReplies += result.replyCount;
    } catch (err) {
      console.log(`❌ 실패: ${(err as Error).message}`);
      failCount++;
    }
  }

  console.log("\n==========  4. 완료 요약  ==========");
  console.log(`  성공: ${posts.length - failCount}/${posts.length}`);
  console.log(`  생성된 댓글: ${totalComments}건`);
  console.log(`  생성된 답글: ${totalReplies}건`);
  console.log(`  총 PendingComment: ${totalComments + totalReplies}건 (예약됨, 크론에 의해 점진적으로 Comment로 변환)`);
  console.log(`  실패: ${failCount}개 게시글`);

  const finalPending = await prisma.pendingComment.count();
  console.log(`\n  📊 최종 DB 상태:`);
  console.log(`     Comment:         ${await prisma.comment.count()}건`);
  console.log(`     PendingComment:  ${finalPending}건 (PENDING ${await prisma.pendingComment.count({ where: { status: "PENDING" } })})`);
  console.log("=====================================\n");

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
