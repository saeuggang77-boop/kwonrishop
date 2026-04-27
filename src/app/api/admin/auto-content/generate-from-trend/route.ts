import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { GhostPersonality } from "@/generated/prisma/client";
import { getTrendInspiredPostsPrompt } from "@/lib/auto-content/prompts";
import { searchNaver } from "@/lib/auto-content/naver-search";
import { logAiUsage } from "@/lib/ai-usage";
import { rateLimitRequest } from "@/lib/rate-limit";
import { requireAdmin } from "@/lib/admin-guard";

/**
 * 트렌드 영감 기반 게시글 생성
 * - 네이버 검색 API에서 키워드 관련 최근 블로그/카페 글의 title+description만 수집
 * - AI가 그 트렌드를 영감으로만 받고 표현은 100% 새로 작성
 * - ContentPool에 isUsed=false로 저장 (검수 후 수동 또는 cron에서 발행)
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitError = await rateLimitRequest(request, 5, 60000);
    if (rateLimitError) return rateLimitError;

    const { error, status } = await requireAdmin();
    if (error) return NextResponse.json({ error }, { status });

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "AI 서비스를 사용할 수 없습니다" }, { status: 503 });
    }
    if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
      return NextResponse.json({ error: "네이버 API 키가 설정되지 않았습니다" }, { status: 503 });
    }

    const body = await request.json();
    const {
      keyword,
      count = 10,
      source = "blog",
      category = "FREE",
    } = body as {
      keyword: string;
      count: number;
      source?: "blog" | "cafe";
      category?: string;
    };

    if (!keyword || keyword.trim().length === 0) {
      return NextResponse.json({ error: "검색 키워드는 필수입니다" }, { status: 400 });
    }
    if (count < 1 || count > 30) {
      return NextResponse.json({ error: "생성 수는 1~30 사이여야 합니다" }, { status: 400 });
    }

    // 1. 네이버 검색 — title+description 30개 수집 (영감 자료, 본문은 가져오지 않음)
    const trendItems = await searchNaver(keyword.trim(), source, 30, "date");
    if (trendItems.length === 0) {
      return NextResponse.json({ error: "검색 결과가 없습니다. 다른 키워드를 시도해보세요" }, { status: 404 });
    }

    // 2. AI 생성 — personality별로 나눠서 다양성 확보
    const personalities: GhostPersonality[] = [
      "CHATTY", "ADVISOR", "QUESTIONER", "EMOJI_LOVER", "CALM", "SASSY",
    ];

    let totalGenerated = 0;
    const generatedBefore = new Date();
    const perPersonality = Math.ceil(count / personalities.length);

    for (const personality of personalities) {
      const toGenerate = Math.min(perPersonality, count - totalGenerated);
      if (toGenerate <= 0) break;

      const categoryAssignments = Array.from({ length: toGenerate }, () => category);

      const prompt = getTrendInspiredPostsPrompt(
        personality,
        toGenerate,
        keyword.trim(),
        trendItems,
        categoryAssignments
      );

      try {
        const anthropic = new Anthropic();
        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 4000,
          messages: [{ role: "user", content: prompt }],
        });

        await logAiUsage(
          message.model,
          message.usage.input_tokens,
          message.usage.output_tokens,
          `auto-content-trend-post`
        );

        const text = message.content[0].type === "text" ? message.content[0].text : "";
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) continue;

        const items = JSON.parse(jsonMatch[0]) as Array<{ title?: string; content: string }>;

        await prisma.contentPool.createMany({
          data: items.map((item, idx) => ({
            type: "POST",
            personality,
            title: item.title || null,
            content: item.content,
            category: categoryAssignments[idx] || "FREE",
            isUsed: false,
          })),
        });

        totalGenerated += items.length;
      } catch (err) {
        console.error(`AI trend generation error for ${personality}:`, err instanceof Error ? err.message : err);
        continue;
      }
    }

    return NextResponse.json({
      message: `네이버 트렌드 "${keyword}" 기반으로 ${totalGenerated}개의 원고가 생성되었습니다`,
      generated: totalGenerated,
      keyword,
      source,
      trendItemsUsed: trendItems.length,
      generatedAfter: generatedBefore.toISOString(),
    });
  } catch (error) {
    console.error("Trend generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "트렌드 원고 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
