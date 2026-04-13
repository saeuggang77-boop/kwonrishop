import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { logAiUsage } from "@/lib/ai-usage";
import { rateLimitRequest } from "@/lib/rate-limit";

const anthropic = new Anthropic();

const EXTRACTION_PROMPT = `당신은 한국 상가직거래 플랫폼 "권리샵"의 SEO 전문가입니다.
권리샵은 상가 매물 직거래, 창업, 프랜차이즈, 집기장터, 협력업체 정보를 제공하는 서비스입니다.

아래 게시글 50개를 분석하여, 자주 등장하는 **상가거래 및 창업 관련 핵심 키워드**를 추출하세요.

키워드 추출 규칙:
1. 2~5글자 단어로 구성 (예: "권리금", "상가창업", "프랜차이즈", "매물")
2. 일반적인 단어 제외 (예: "정말", "진짜", "오늘", "나중에")
3. 상가거래/창업/부동산/프랜차이즈/매물/집기/협력업체 관련 키워드만 포함
4. 중복 제거, 유사어는 가장 대표적인 표현으로 통일 (예: "창업비용", "창업자금" → "창업비용")
5. 정확히 30개만 추출

게시글 목록:
{posts}

반드시 아래 JSON 배열 형식으로만 반환하세요 (다른 텍스트 없이):
["키워드1", "키워드2", ...]`;

export async function POST(request: NextRequest) {
  try {
    const rateLimitError = await rateLimitRequest(request, 10, 60000);
    if (rateLimitError) return rateLimitError;

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "AI 서비스를 사용할 수 없습니다" }, { status: 503 });
    }

    const body = await request.json();
    const { posts, texts } = body as { posts?: Array<{ title: string; content: string }>; texts?: string[] };

    let postsText = "";

    // texts 배열 형식 지원
    if (texts && Array.isArray(texts) && texts.length > 0) {
      postsText = texts
        .slice(0, 50)
        .map((text, i) => `[${i + 1}] ${text.slice(0, 300)}`)
        .join("\n\n");
    }
    // posts 배열 형식 지원 (기존)
    else if (posts && Array.isArray(posts) && posts.length > 0) {
      postsText = posts
        .slice(0, 50)
        .map((p, i) => `[${i + 1}] 제목: ${p.title}\n내용: ${p.content.slice(0, 200)}`)
        .join("\n\n");
    }
    else {
      return NextResponse.json({ error: "게시글 목록 또는 텍스트 배열이 필요합니다" }, { status: 400 });
    }

    const prompt = EXTRACTION_PROMPT.replace("{posts}", postsText);

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
      "keyword-extraction"
    );

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = responseText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

    let keywords: string[];
    try {
      keywords = JSON.parse(cleaned) as string[];
    } catch (parseError) {
      // JSON 파싱 실패 시 regex로 배열 부분만 추출
      const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        keywords = JSON.parse(arrayMatch[0]) as string[];
      } else {
        throw new Error("키워드 배열을 찾을 수 없습니다");
      }
    }

    return NextResponse.json({
      keywords: keywords.slice(0, 30), // 정확히 30개
      message: `${keywords.length}개의 키워드가 추출되었습니다`,
    });
  } catch (error) {
    console.error("Keyword extraction error:", error);
    return NextResponse.json(
      { error: "키워드 추출에 실패했습니다" },
      { status: 500 }
    );
  }
}
