import { prisma } from "@/lib/prisma";
import type { GhostPersonality, ContentType } from "@/generated/prisma/client";
import Anthropic from "@anthropic-ai/sdk";
import {
  getContextualCommentPrompt,
  getContextualReplyPrompt,
  getConversationThreadPrompt,
  getSingleCommenterPrompt,
  getAuthorReplyPrompt,
  getCommenterFollowupPrompt,
  type CommenterArchetype,
} from "./prompts";
import { logAiUsage } from "@/lib/ai-usage";

// ============================================================
// V2 헬퍼: 유사도 검사 / 금지어 / 아키타입 분배
// ============================================================

const BANNED_SUBSTRINGS = [
  "무슨 업종이세요",
  "어떤 업종이신지",
  "업종이신가요",
  "여름이라 그런거",
  "웨이팅까지 생기",
  "뿌듯하시겠어요",
  "저희 매장도 비슷",
  "저희도 요즘",
  "저희도 지금",
  "대박이네요!!",
  "축하드려요!!",
];

const COMMENTS_BY_ARCHETYPE_ORDER: CommenterArchetype[][] = [
  // 2명
  ["QUESTION", "EXPERIENCE"],
  ["OUTSIDER", "EXPERIENCE"],
  ["LURKER", "CONTRARIAN"],
  ["EXPERIENCE", "TANGENT"],
  // 3명
  ["QUESTION", "EXPERIENCE", "LURKER"],
  ["OUTSIDER", "TIPSTER", "CONTRARIAN"],
  ["EXPERIENCE", "QUESTION", "TANGENT"],
  ["LURKER", "EXPERIENCE", "OUTSIDER"],
  // 4명
  ["QUESTION", "EXPERIENCE", "CONTRARIAN", "LURKER"],
  ["OUTSIDER", "QUESTION", "TIPSTER", "TANGENT"],
  ["EXPERIENCE", "LURKER", "CONTRARIAN", "OUTSIDER"],
  ["TIPSTER", "QUESTION", "TANGENT", "EXPERIENCE"],
];

function pickArchetypeSet(count: number): CommenterArchetype[] {
  const candidates = COMMENTS_BY_ARCHETYPE_ORDER.filter((a) => a.length === count);
  if (candidates.length === 0) {
    // fallback: OUTSIDER 포함해서 랜덤
    const pool: CommenterArchetype[] = ["OUTSIDER", "EXPERIENCE", "QUESTION", "LURKER", "CONTRARIAN", "TIPSTER", "TANGENT"];
    const picked: CommenterArchetype[] = ["OUTSIDER"]; // 최소 1명 외부 시점 강제
    while (picked.length < count) {
      const cand = pool[Math.floor(Math.random() * pool.length)];
      picked.push(cand);
    }
    return picked;
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function tokenize(text: string): Set<string> {
  const clean = text.replace(/[^\uAC00-\uD7AFa-zA-Z0-9\s]/g, " ").toLowerCase();
  return new Set(clean.split(/\s+/).filter((t) => t.length >= 2));
}

function jaccardSimilarity(a: string, b: string): number {
  const A = tokenize(a);
  const B = tokenize(b);
  if (A.size === 0 || B.size === 0) return 0;
  let intersect = 0;
  for (const t of A) if (B.has(t)) intersect++;
  const union = A.size + B.size - intersect;
  return union === 0 ? 0 : intersect / union;
}

function containsBannedSubstring(text: string): string | null {
  for (const banned of BANNED_SUBSTRINGS) {
    if (text.includes(banned)) return banned;
  }
  return null;
}

function isTooSimilarToExisting(candidate: string, existing: string[], threshold = 0.45): boolean {
  for (const e of existing) {
    if (jaccardSimilarity(candidate, e) >= threshold) return true;
  }
  return false;
}

function randomTemperature(): number {
  // Anthropic 허용 범위 0~1. 댓글러마다 0.6~1.0 랜덤 분산
  return 0.6 + Math.random() * 0.4;
}

function parseSingleJsonContent(responseText: string): string {
  const cleaned = responseText
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  // 1차 시도: 정상 JSON 파싱
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed[0]?.content ?? "";
    return parsed?.content ?? "";
  } catch {
    // 2차 시도: content 필드 정규식 추출 (줄바꿈/제어문자 이슈 우회)
    const match = cleaned.match(/"content"\s*:\s*"((?:[^"\\]|\\.|[\r\n])*)"/);
    if (match) {
      return match[1]
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\")
        .trim();
    }
    // 3차 시도: 따옴표 없는 텍스트라도 반환
    return "";
  }
}

/**
 * 단일 댓글러의 댓글 1개 생성 (독립 호출, 재시도 1회)
 */
async function generateOneComment(params: {
  anthropic: Anthropic;
  personality: GhostPersonality;
  archetype: CommenterArchetype;
  postTitle: string;
  postContent: string;
  commenterName: string;
  existingComments: string[];
}): Promise<string | null> {
  const { anthropic, personality, archetype, postTitle, postContent, commenterName, existingComments } = params;

  for (let attempt = 0; attempt < 2; attempt++) {
    const prompt = getSingleCommenterPrompt(
      personality,
      archetype,
      postTitle,
      postContent,
      commenterName,
      existingComments
    );
    const temperature = randomTemperature();

    try {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 500,
        temperature,
        messages: [{ role: "user", content: prompt }],
      });
      await logAiUsage(
        message.model,
        message.usage.input_tokens,
        message.usage.output_tokens,
        "single-commenter"
      );
      const responseText = message.content[0].type === "text" ? message.content[0].text : "";
      const content = parseSingleJsonContent(responseText).trim();
      if (!content) continue;

      const banned = containsBannedSubstring(content);
      if (banned) {
        if (attempt === 0) continue; // 재시도
        // 2회차에도 나오면 그냥 그 부분만 제거
      }
      if (isTooSimilarToExisting(content, existingComments)) {
        if (attempt === 0) continue;
      }
      return content;
    } catch (err) {
      console.error(`[generateOneComment] attempt ${attempt} failed:`, err);
      if (attempt === 1) return null;
    }
  }
  return null;
}

async function generateAuthorReplyText(params: {
  anthropic: Anthropic;
  authorPersonality: GhostPersonality;
  authorName: string;
  postTitle: string;
  postContent: string;
  targetCommenterName: string;
  targetCommentContent: string;
}): Promise<string | null> {
  const prompt = getAuthorReplyPrompt(
    params.authorPersonality,
    params.authorName,
    params.postTitle,
    params.postContent,
    params.targetCommenterName,
    params.targetCommentContent
  );
  try {
    const message = await params.anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 300,
      temperature: randomTemperature(),
      messages: [{ role: "user", content: prompt }],
    });
    await logAiUsage(
      message.model,
      message.usage.input_tokens,
      message.usage.output_tokens,
      "author-reply"
    );
    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    return parseSingleJsonContent(responseText).trim() || null;
  } catch (err) {
    console.error("[generateAuthorReplyText] failed:", err);
    return null;
  }
}

async function generateCommenterFollowupText(params: {
  anthropic: Anthropic;
  personality: GhostPersonality;
  commenterName: string;
  postTitle: string;
  myPreviousComment: string;
  authorName: string;
  authorReply: string;
}): Promise<string | null> {
  const prompt = getCommenterFollowupPrompt(
    params.personality,
    params.commenterName,
    params.postTitle,
    params.myPreviousComment,
    params.authorName,
    params.authorReply
  );
  try {
    const message = await params.anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 200,
      temperature: randomTemperature(),
      messages: [{ role: "user", content: prompt }],
    });
    await logAiUsage(
      message.model,
      message.usage.input_tokens,
      message.usage.output_tokens,
      "commenter-followup"
    );
    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    return parseSingleJsonContent(responseText).trim() || null;
  } catch (err) {
    console.error("[generateCommenterFollowupText] failed:", err);
    return null;
  }
}

/**
 * V2 독립 호출 아키텍처로 스레드 플랜 생성 (DB 저장 전 단계)
 * - 각 댓글러별 독립 API 호출 (서로의 댓글을 참조하여 중복 회피)
 * - archetype 강제 분배 + temperature 분산
 * - jaccard 유사도 체크
 */
export interface ThreadPlanMessage {
  commenterName: string;
  commenterUserId: string;
  content: string;
  replyToIndex: number | null;
  isAuthor: boolean;
}

export async function buildConversationThreadPlan(params: {
  post: { id: string; title: string; content: string; authorId: string };
  threadSize: number;
  authorReplyRate: number;
}): Promise<ThreadPlanMessage[]> {
  const { post, threadSize, authorReplyRate } = params;
  const anthropic = new Anthropic();

  // 1. 글쓴이 조회
  const author = await prisma.user.findUnique({
    where: { id: post.authorId },
    select: { name: true, ghostPersonality: true },
  });
  if (!author || !author.ghostPersonality) {
    throw new Error("Author not found or not a ghost user");
  }
  const authorName = author.name || "익명";
  const authorPersonality = author.ghostPersonality;

  // 2. 댓글러 선정 (2~4명)
  const commenterCount = Math.max(2, Math.min(4, Math.floor(threadSize / 2)));
  const commenters = await getRandomGhostUsers(commenterCount, undefined, post.authorId);
  if (commenters.length === 0) throw new Error("No commenters available");

  // 3. archetype 분배
  const archetypes = pickArchetypeSet(commenters.length);

  // 4. 각 댓글러 독립 호출 (순차 — 이전 댓글을 existingComments로 주입해야 함)
  const topLevel: ThreadPlanMessage[] = [];
  for (let i = 0; i < commenters.length; i++) {
    const c = commenters[i];
    const existing = topLevel.map((m) => m.content);
    const content = await generateOneComment({
      anthropic,
      personality: c.ghostPersonality || "CALM",
      archetype: archetypes[i],
      postTitle: post.title,
      postContent: post.content,
      commenterName: c.name || "익명",
      existingComments: existing,
    });
    if (!content) continue;
    topLevel.push({
      commenterName: c.name || "익명",
      commenterUserId: c.id,
      content,
      replyToIndex: null,
      isAuthor: false,
    });
  }

  if (topLevel.length === 0) return [];

  // 5. 글쓴이 답글 (authorReplyRate% 확률로 각 댓글에 답글)
  const planMessages: ThreadPlanMessage[] = [...topLevel];
  const authorReplyIndices: number[] = []; // 어떤 topLevel 인덱스에 답글 달렸는지

  for (let i = 0; i < topLevel.length; i++) {
    if (Math.random() * 100 > authorReplyRate) continue;
    const target = topLevel[i];
    const replyContent = await generateAuthorReplyText({
      anthropic,
      authorPersonality,
      authorName,
      postTitle: post.title,
      postContent: post.content,
      targetCommenterName: target.commenterName,
      targetCommentContent: target.content,
    });
    if (!replyContent) continue;
    const replyIdxInPlan = planMessages.length;
    planMessages.push({
      commenterName: authorName,
      commenterUserId: post.authorId,
      content: replyContent.startsWith("@") ? replyContent : `@${target.commenterName} ${replyContent}`,
      replyToIndex: i, // topLevel index
      isAuthor: true,
    });
    authorReplyIndices.push(replyIdxInPlan);
  }

  // 6. 티키타카 (40% 확률로 댓글러가 글쓴이 답글에 다시 반응)
  for (const authorReplyIdx of authorReplyIndices) {
    if (Math.random() > 0.4) continue;
    const authorReplyMsg = planMessages[authorReplyIdx];
    const originalTopLevelIdx = authorReplyMsg.replyToIndex!;
    const originalCommenter = topLevel[originalTopLevelIdx];
    const followupContent = await generateCommenterFollowupText({
      anthropic,
      personality: commenters.find((c) => c.id === originalCommenter.commenterUserId)?.ghostPersonality || "CALM",
      commenterName: originalCommenter.commenterName,
      postTitle: post.title,
      myPreviousComment: originalCommenter.content,
      authorName,
      authorReply: authorReplyMsg.content,
    });
    if (!followupContent) continue;
    planMessages.push({
      commenterName: originalCommenter.commenterName,
      commenterUserId: originalCommenter.commenterUserId,
      content: followupContent.startsWith("@") ? followupContent : `@${authorName} ${followupContent}`,
      replyToIndex: authorReplyIdx,
      isAuthor: false,
    });
  }

  return planMessages;
}

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
    // V2 독립 호출 아키텍처 사용
    const plan = await buildConversationThreadPlan({
      post: { id: post.id, title: post.title, content: post.content, authorId: post.authorId },
      threadSize,
      authorReplyRate,
    });

    if (plan.length === 0) {
      return { commentCount: 0, replyCount: 0 };
    }

    // plan을 기존 scheduleTimes/PendingComment 포맷으로 변환
    const parsedForSchedule = plan.map((m) => ({ replyTo: m.replyToIndex }));
    const basePostCreatedAt = post.createdAt ?? new Date();
    const scheduledTimes = computeScheduledTimes(parsedForSchedule, basePostCreatedAt);

    const indexToPendingId = new Map<number, string>();
    let commentCount = 0;
    let replyCount = 0;

    for (let i = 0; i < plan.length; i++) {
      const msg = plan[i];
      const parentPendingId =
        msg.replyToIndex !== null ? indexToPendingId.get(msg.replyToIndex) ?? null : null;

      const pending = await prisma.pendingComment.create({
        data: {
          postId: post.id,
          authorId: msg.commenterUserId,
          authorName: msg.commenterName,
          content: msg.content,
          parentPendingId,
          scheduledFor: scheduledTimes[i],
          status: "PENDING",
        },
      });
      indexToPendingId.set(i, pending.id);

      if (msg.replyToIndex === null) commentCount++;
      else replyCount++;
    }

    return { commentCount, replyCount };
  } catch (error) {
    console.error("대화 스레드 생성 실패:", error);
    throw error;
  }
}

/**
 * @deprecated V1 단일 호출 방식 (참고용으로 보존)
 * 사용하지 마세요. generateConversationThread를 호출하세요.
 */
export async function generateConversationThreadV1(
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
