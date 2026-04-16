import { prisma } from "@/lib/prisma";
import type { GhostPersonality, ContentType } from "@/generated/prisma/client";
import Anthropic from "@anthropic-ai/sdk";
import {
  getContextualCommentPrompt,
  getContextualReplyPrompt,
  getConversationThreadPrompt,
} from "./prompts";
import { logAiUsage } from "@/lib/ai-usage";

/**
 * 자정 넘기는 시간대 처리 (예: 14시~4시)
 */
export function isWithinActiveHours(kstHour: number, start: number, end: number): boolean {
  if (start === end) return true; // 0시~0시 = 24시간
  if (start < end) {
    return kstHour >= start && kstHour < end;
  }
  return kstHour >= start || kstHour < end;
}

/**
 * 일일 목표에 요일별 + 타입별 랜덤 변동 적용
 * - 금토: +20~30%, 월화: -10~20%, 수목일: ±10%
 * - 콘텐츠 타입별로 독립 변동 (게시글/댓글/답글 각각 다른 값)
 * - 날짜 기반 시드로 같은 날에는 같은 값 유지
 */
export function getDailyTarget(base: number, typeOffset: number = 0): number {
  const today = new Date();
  const kstDay = new Date(today.getTime() + 9 * 60 * 60 * 1000).getUTCDay(); // KST 요일
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate() + typeOffset * 7;
  const pseudo = Math.sin(seed) * 10000;
  const rand = pseudo - Math.floor(pseudo); // 0~1

  // 요일별 기본 배율 (금=5, 토=6)
  let min: number, max: number;
  if (kstDay === 5 || kstDay === 6) {
    min = 1.2; max = 1.3; // 금토: +20~30%
  } else if (kstDay === 1 || kstDay === 2) {
    min = 0.8; max = 0.9; // 월화: -10~20%
  } else {
    min = 0.9; max = 1.1; // 수목일: ±10%
  }

  const ratio = min + rand * (max - min);
  return Math.max(1, Math.round(base * ratio));
}

/**
 * 게시글/댓글 ID 기반 편중 분배
 * 같은 ID는 항상 같은 목표값 → 20% 묻힌 글(0개), 50% 평균, 30% 핫글(2배)
 */
export function getContentTarget(id: string, base: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const norm = Math.abs(Math.sin(hash)); // 0~1

  if (norm < 0.2) return 0; // 20% 묻힌 글
  if (norm < 0.7) return Math.max(1, Math.round(base * (0.5 + norm))); // 50% 평균
  return Math.max(1, Math.round(base * (1.2 + norm * 0.8))); // 30% 핫글
}

/**
 * 게시글 ID 기반 결정론적 대화 목표 계산
 * 같은 게시글은 항상 같은 목표값을 반환 (min~max 사이)
 */
export function getPostConversationTarget(postId: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < postId.length; i++) {
    hash = ((hash << 5) - hash) + postId.charCodeAt(i);
    hash |= 0;
  }
  const norm = Math.abs(hash) % (max - min + 1);
  return min + norm;
}

/**
 * 활성 시간대의 총 시간 수 계산
 */
export function getActiveHoursCount(start: number, end: number): number {
  if (start === end) return 24; // 0시~0시 = 24시간
  if (start < end) {
    return end - start;
  }
  return (24 - start) + end;
}

/**
 * 슬롯별 할당량 계산 (+-50% 랜덤 분산)
 * base < 1일 때 최소 40% 확률로 1을 반환
 * (remainingPosts가 소진되면 자연히 0이 되므로 초과 발행 없음)
 */
export function getSlotQuota(dailyQuota: number, totalSlots: number): number {
  if (totalSlots === 0 || dailyQuota <= 0) return 0;
  const base = dailyQuota / totalSlots;
  if (base < 1) {
    return Math.random() < Math.max(base, 0.4) ? 1 : 0;
  }
  const variance = base * 0.5;
  return Math.max(1, Math.round(base + (Math.random() * 2 - 1) * variance));
}

/**
 * 랜덤 유령회원 조회
 */
export async function getRandomGhostUsers(count: number, personality?: GhostPersonality, excludeUserId?: string) {
  const where: Record<string, unknown> = { isGhost: true };
  if (personality) where.ghostPersonality = personality;
  if (excludeUserId) where.id = { not: excludeUserId };

  const ghosts = await prisma.user.findMany({
    where,
    select: { id: true, name: true, ghostPersonality: true },
  });

  // Fisher-Yates shuffle
  const shuffled = [...ghosts];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}

/**
 * 미사용 콘텐츠 풀 아이템 조회
 */
export async function getUnusedContent(type: ContentType, count: number, personality?: GhostPersonality) {
  const where: Record<string, unknown> = { type, isUsed: false };
  if (personality) where.personality = personality;

  const items = await prisma.contentPool.findMany({
    where,
    take: count * 3,
    orderBy: { createdAt: "asc" },
  });

  // Shuffle and take count
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}

/**
 * 오늘 고스트가 생성한 항목 수 조회 (KST 자정 기준)
 */
export async function getTodayGhostCounts() {
  // KST 자정 기준 (UTC+9)
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset);
  const todayStart = new Date(
    Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate()) - kstOffset
  );

  const [posts, comments] = await Promise.all([
    prisma.post.count({
      where: {
        createdAt: { gte: todayStart },
        author: { isGhost: true },
      },
    }),
    prisma.comment.count({
      where: {
        createdAt: { gte: todayStart },
        author: { isGhost: true },
      },
    }),
  ]);

  const topLevelComments = await prisma.comment.count({
    where: {
      createdAt: { gte: todayStart },
      author: { isGhost: true },
      parentId: null,
    },
  });

  return {
    posts,
    comments: topLevelComments,
    replies: comments - topLevelComments,
  };
}

/**
 * 게시글 내용 기반 실시간 댓글 생성
 */
export async function generateContextualComments(
  postTitle: string,
  postContent: string,
  count: number
): Promise<string[]> {
  try {
    const anthropic = new Anthropic();

    // 랜덤 성격 선택
    const personalities: GhostPersonality[] = [
      "CHATTY",
      "ADVISOR",
      "QUESTIONER",
      "EMOJI_LOVER",
      "CALM",
      "SASSY",
    ];
    const randomPersonality = personalities[Math.floor(Math.random() * personalities.length)];

    const prompt = getContextualCommentPrompt(randomPersonality, postTitle, postContent, count);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    // AI 사용량 로깅
    await logAiUsage(
      message.model,
      message.usage.input_tokens,
      message.usage.output_tokens,
      "contextual-comment"
    );

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = responseText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned) as Array<{ content: string }>;

    return parsed.map((item) => item.content);
  } catch (error) {
    console.error("실시간 댓글 생성 실패:", error);
    return [];
  }
}

/**
 * 댓글 내용 기반 실시간 답글 생성
 */
export async function generateContextualReplies(
  postTitle: string,
  commentContent: string,
  count: number,
  personality?: GhostPersonality
): Promise<string[]> {
  try {
    const anthropic = new Anthropic();

    // 지정된 성격 사용, 없으면 랜덤
    const personalities: GhostPersonality[] = [
      "CHATTY",
      "ADVISOR",
      "QUESTIONER",
      "EMOJI_LOVER",
      "CALM",
      "SASSY",
    ];
    const selectedPersonality = personality || personalities[Math.floor(Math.random() * personalities.length)];

    const prompt = getContextualReplyPrompt(selectedPersonality, postTitle, commentContent, count);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    // AI 사용량 로깅
    await logAiUsage(
      message.model,
      message.usage.input_tokens,
      message.usage.output_tokens,
      "contextual-reply"
    );

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = responseText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned) as Array<{ content: string }>;

    return parsed.map((item) => item.content);
  } catch (error) {
    console.error("실시간 답글 생성 실패:", error);
    return [];
  }
}

/**
 * 각 메시지에 scheduledFor 시간 할당
 * - 첫 댓글(replyTo=null 최초): 게시글 작성시간 + 30분~3시간 랜덤
 * - 이후 댓글: 직전 댓글 + 1~4시간 랜덤, 전체 12시간 이내 분산
 * - 답글: 부모 메시지 scheduledFor + 2~12시간 랜덤
 */
export function computeScheduledTimes(
  messages: Array<{ replyTo: number | null }>,
  basePostCreatedAt: Date
): Date[] {
  const scheduledTimes: Date[] = new Array(messages.length);
  const baseMs = basePostCreatedAt.getTime();

  // 첫 최상위 댓글 기준 시간 추적
  let lastTopLevelMs: number | null = null;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    if (msg.replyTo === null || msg.replyTo === undefined) {
      // 최상위 댓글
      if (lastTopLevelMs === null) {
        // 첫 댓글: 게시글 + 30분~3시간
        const offsetMs = (30 + Math.floor(Math.random() * 150)) * 60 * 1000;
        scheduledTimes[i] = new Date(baseMs + offsetMs);
      } else {
        // 이후 댓글: 직전 최상위 댓글 + 1~4시간
        const offsetMs = (60 + Math.floor(Math.random() * 180)) * 60 * 1000;
        const candidate = lastTopLevelMs + offsetMs;
        // 전체 12시간 이내 제한
        const maxMs = baseMs + 12 * 60 * 60 * 1000;
        scheduledTimes[i] = new Date(Math.min(candidate, maxMs));
      }
      lastTopLevelMs = scheduledTimes[i].getTime();
    } else {
      // 답글: 부모 scheduledFor + 2~12시간
      const parentTime = scheduledTimes[msg.replyTo];
      const parentMs = parentTime ? parentTime.getTime() : baseMs;
      const offsetMs = (120 + Math.floor(Math.random() * 600)) * 60 * 1000;
      scheduledTimes[i] = new Date(parentMs + offsetMs);
    }
  }

  return scheduledTimes;
}

/**
 * 게시글에 대한 전체 대화 스레드 생성 (댓글+답글 통합)
 * AI 1회 호출로 코히런트한 스레드 생성 후 PendingComment에 예약 저장
 */
export async function generateConversationThread(
  post: { id: string; title: string; content: string; authorId: string; createdAt?: Date },
  threadSize: number,
  authorReplyRate: number = 50
): Promise<{ commentCount: number; replyCount: number }> {
  try {
    // 1. 글쓴이 정보 조회
    const author = await prisma.user.findUnique({
      where: { id: post.authorId },
      select: { name: true, ghostPersonality: true },
    });

    if (!author || !author.ghostPersonality) {
      throw new Error("Author not found or not a ghost user");
    }

    // 2. 랜덤 유령회원 선택 (글쓴이 제외)
    // 30% 확률로 깊은 대화 모드 (1~2명으로 집중)
    const isDeepConversation = Math.random() < 0.3;
    const commenterCount = isDeepConversation
      ? Math.floor(Math.random() * 2) + 1  // 1~2명
      : Math.min(Math.max(2, Math.floor(Math.random() * 3) + 2), 4); // 2~4명
    const commenters = await getRandomGhostUsers(commenterCount, undefined, post.authorId);

    if (commenters.length === 0) {
      throw new Error("No commenters available");
    }

    const commenterNames = commenters.map(c => c.name || "익명");
    const commenterPersonalities = commenters.map(c => c.ghostPersonality || "CALM");

    // 3. AI로 대화 스레드 생성
    const anthropic = new Anthropic();
    const prompt = getConversationThreadPrompt(
      author.ghostPersonality,
      author.name || "익명",
      post.title,
      post.content,
      commenterNames,
      commenterPersonalities,
      threadSize,
      authorReplyRate
    );

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    // AI 사용량 로깅
    await logAiUsage(
      message.model,
      message.usage.input_tokens,
      message.usage.output_tokens,
      "conversation-thread"
    );

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = responseText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    let parsed = JSON.parse(cleaned) as Array<{
      name: string;
      content: string;
      replyTo: number | null;
    }>;

    // 3.5 안전장치: 작성자가 최상위 댓글(replyTo: null)을 쓴 경우 제거
    // 작성자는 답글(replyTo: 숫자)만 달아야 자연스러움
    const authorNameStr = author.name || "익명";
    const originalLength = parsed.length;
    parsed = parsed.filter((msg) => {
      if (msg.name === authorNameStr && (msg.replyTo === null || msg.replyTo === undefined)) {
        return false;
      }
      return true;
    });

    // replyTo 인덱스 재조정 (제거된 항목 반영)
    if (parsed.length < originalLength) {
      // 원본 인덱스 → 새 인덱스 매핑 테이블 생성
      const originalParsed = JSON.parse(cleaned) as Array<{ name: string; content: string; replyTo: number | null }>;
      const oldToNew = new Map<number, number>();
      let newIdx = 0;
      for (let oldIdx = 0; oldIdx < originalParsed.length; oldIdx++) {
        const msg = originalParsed[oldIdx];
        if (msg.name === authorNameStr && (msg.replyTo === null || msg.replyTo === undefined)) {
          continue; // 제거된 항목
        }
        oldToNew.set(oldIdx, newIdx);
        newIdx++;
      }

      // replyTo 인덱스 갱신
      parsed = parsed.map((msg, idx) => {
        if (msg.replyTo !== null && msg.replyTo !== undefined) {
          const newReplyTo = oldToNew.get(msg.replyTo);
          if (newReplyTo === undefined) {
            // 참조 대상이 제거된 경우 → 가장 가까운 이전 최상위 댓글에 답글로 연결
            let fallbackIdx: number | null = null;
            for (let k = idx - 1; k >= 0; k--) {
              if (parsed[k].replyTo === null || parsed[k].replyTo === undefined) {
                fallbackIdx = k;
                break;
              }
            }
            if (fallbackIdx !== null) {
              return { ...msg, replyTo: fallbackIdx };
            }
            return { ...msg, replyTo: 0 };
          }
          return { ...msg, replyTo: newReplyTo };
        }
        return msg;
      });

      // 3.6 2차 안전장치: 인덱스 재조정으로 작성자 최상위 댓글이 새로 생긴 경우 처리
      parsed = parsed.map((msg, idx) => {
        if (msg.name === authorNameStr && (msg.replyTo === null || msg.replyTo === undefined)) {
          for (let k = idx - 1; k >= 0; k--) {
            if (parsed[k].name !== authorNameStr && (parsed[k].replyTo === null || parsed[k].replyTo === undefined)) {
              return { ...msg, replyTo: k };
            }
          }
          for (let k = idx + 1; k < parsed.length; k++) {
            if (parsed[k].name !== authorNameStr && (parsed[k].replyTo === null || parsed[k].replyTo === undefined)) {
              return { ...msg, replyTo: k };
            }
          }
          if (idx !== 0) return { ...msg, replyTo: 0 };
          return { ...msg, replyTo: -999 };
        }
        return msg;
      });
      parsed = parsed.filter(msg => msg.replyTo !== -999);
    }

    // 4. name → userId/name 매핑
    const nameToUserId = new Map<string, string>();
    const nameToAuthorName = new Map<string, string>();
    nameToUserId.set(author.name || "익명", post.authorId);
    nameToAuthorName.set(author.name || "익명", author.name || "익명");
    commenters.forEach(c => {
      nameToUserId.set(c.name || "익명", c.id);
      nameToAuthorName.set(c.name || "익명", c.name || "익명");
    });

    // 5. 스케줄 시간 계산
    const basePostCreatedAt = post.createdAt ?? new Date();
    const scheduledTimes = computeScheduledTimes(parsed, basePostCreatedAt);

    // 6. PendingComment에 저장 (순서대로, 인덱스→PendingComment.id 매핑)
    const indexToPendingId = new Map<number, string>();
    const messagesByIndex = new Map<number, { name: string; content: string }>();
    let commentCount = 0;
    let replyCount = 0;

    for (let i = 0; i < parsed.length; i++) {
      const msg = parsed[i];
      const userId = nameToUserId.get(msg.name) || post.authorId;
      const authorName = nameToAuthorName.get(msg.name) || msg.name;

      messagesByIndex.set(i, { name: msg.name, content: msg.content });

      let parentPendingId: string | null = null;
      let finalContent = msg.content;

      if (msg.replyTo !== null && msg.replyTo !== undefined) {
        parentPendingId = indexToPendingId.get(msg.replyTo) || null;

        // @이름 prefix 추가
        let targetName: string | null = null;
        let currentIdx = msg.replyTo as number;
        for (let depth = 0; depth < 10; depth++) {
          const searchMsg = messagesByIndex.get(currentIdx);
          if (searchMsg && searchMsg.name !== msg.name) {
            targetName = searchMsg.name;
            break;
          }
          const parentReplyTo = parsed[currentIdx]?.replyTo;
          if (parentReplyTo === null || parentReplyTo === undefined) break;
          currentIdx = parentReplyTo;
        }

        if (targetName) {
          const alreadyMentioned = msg.content.startsWith('@') || msg.content.includes(targetName);
          if (!alreadyMentioned) {
            finalContent = `@${targetName} ${msg.content}`;
          }
        }
      }

      const pending = await prisma.pendingComment.create({
        data: {
          postId: post.id,
          authorId: userId,
          authorName,
          content: finalContent,
          parentPendingId,
          scheduledFor: scheduledTimes[i],
          status: "PENDING",
        },
      });

      indexToPendingId.set(i, pending.id);

      if (msg.replyTo === null || msg.replyTo === undefined) {
        commentCount++;
      } else {
        replyCount++;
      }
    }

    return { commentCount, replyCount };
  } catch (error) {
    console.error("대화 스레드 생성 실패:", error);
    throw error;
  }
}
