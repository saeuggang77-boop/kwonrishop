/**
 * 네이버 검색 API 호출 헬퍼
 * - 자동 콘텐츠의 "트렌드 영감" 모드에서 시의성 있는 키워드/주제 파악용
 * - 본문은 가져오지 않음 (저작권 회피) — title + description(요약)만 활용
 * - AI는 이를 영감으로만 사용해 100% 새 글 작성
 */

const NAVER_BLOG_API = "https://openapi.naver.com/v1/search/blog.json";
const NAVER_CAFE_API = "https://openapi.naver.com/v1/search/cafearticle.json";

export interface NaverSearchItem {
  title: string;        // HTML 태그 제거된 제목
  description: string;  // HTML 태그 제거된 요약
  link: string;
  postdate?: string;    // YYYYMMDD
  bloggername?: string;
  cafename?: string;
}

/**
 * HTML 엔티티 + <b> 태그 제거
 */
function stripHtml(text: string): string {
  return text
    .replace(/<\/?b>/gi, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/**
 * 네이버 검색 호출
 * @param query 검색어
 * @param source "blog" | "cafe"
 * @param display 가져올 개수 (1~100)
 * @param sort "sim"(정확도) | "date"(최신)
 */
export async function searchNaver(
  query: string,
  source: "blog" | "cafe" = "blog",
  display: number = 30,
  sort: "sim" | "date" = "date"
): Promise<NaverSearchItem[]> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경변수 누락");
  }

  const url = source === "blog" ? NAVER_BLOG_API : NAVER_CAFE_API;
  const params = new URLSearchParams({
    query,
    display: String(Math.min(Math.max(display, 1), 100)),
    sort,
  });

  const response = await fetch(`${url}?${params.toString()}`, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`네이버 API 호출 실패: ${response.status} ${errText}`);
  }

  const data = (await response.json()) as { items?: Array<Record<string, string>> };
  const items = data.items ?? [];

  return items.map((item) => ({
    title: stripHtml(item.title || ""),
    description: stripHtml(item.description || ""),
    link: item.link || "",
    postdate: item.postdate,
    bloggername: item.bloggername,
    cafename: item.cafename,
  }));
}

/**
 * 여러 키워드를 묶어서 한 번에 검색 결과 모음
 * 키워드별로 일부 가져와 다양성 확보
 */
export async function searchMultipleKeywords(
  keywords: string[],
  perKeyword: number = 10,
  source: "blog" | "cafe" = "blog"
): Promise<NaverSearchItem[]> {
  const results = await Promise.all(
    keywords.map((kw) =>
      searchNaver(kw, source, perKeyword).catch((err) => {
        console.error(`[searchMultipleKeywords] "${kw}" 실패:`, err);
        return [] as NaverSearchItem[];
      })
    )
  );
  return results.flat();
}
